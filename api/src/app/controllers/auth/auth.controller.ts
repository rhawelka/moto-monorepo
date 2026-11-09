import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../services/auth/auth.service';
import { CreateUserDto, LoginDto } from '@moto-monorepo/dto';
import { AuthGuard } from '@nestjs/passport';
import { LoggerService } from '@moto-monorepo/services';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

const GOOGLE_STATE_COOKIE = 'google_oauth_state';
const GOOGLE_CALLBACK_PATH = '/api/v1/auth/google/callback';
const GOOGLE_AUTHORIZATION_ENDPOINT =
  'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_ENDPOINT =
  'https://openidconnect.googleapis.com/v1/userinfo';
const OAUTH_STATE_MAX_AGE_MS = 5 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: CreateUserDto) {
    this.logger.log(`Registering new user with email: ${dto.email}`);
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);
    return this.authService.login(dto);
  }

  @Get('google')
  startGoogleLogin(@Res() response: ExpressResponse): void {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const callbackUrl = this.getGoogleCallbackUrl();

    if (!clientId || !this.configService.get<string>('GOOGLE_CLIENT_SECRET')) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured on this server',
      );
    }

    const state = randomBytes(32).toString('hex');

    response.cookie(GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: OAUTH_STATE_MAX_AGE_MS,
      path: GOOGLE_CALLBACK_PATH,
    });

    const authorizationUrl = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
    authorizationUrl.searchParams.set('client_id', clientId);
    authorizationUrl.searchParams.set('redirect_uri', callbackUrl);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', 'openid email profile');
    authorizationUrl.searchParams.set('state', state);

    response.redirect(authorizationUrl.toString());
  }

  @Get('google/callback')
  async completeGoogleLogin(
    @Req() request: ExpressRequest,
    @Res() response: ExpressResponse,
    @Query() query: Record<string, unknown>,
  ): Promise<void> {
    this.clearGoogleStateCookie(response);
    const code = typeof query.code === 'string' ? query.code : undefined;
    const state = typeof query.state === 'string' ? query.state : undefined;

    if (
      query.error ||
      !code ||
      !this.hasValidOAuthState(
        state,
        this.getCookie(request, GOOGLE_STATE_COOKIE),
      )
    ) {
      response.redirect(this.getFrontendLoginUrl('google-login-failed'));
      return;
    }

    try {
      const email = await this.getVerifiedGoogleEmail(code);
      const authResponse = await this.authService.loginWithGoogle(email);
      const callbackUrl = new URL('/auth/callback', this.getFrontendUrl());

      callbackUrl.hash = new URLSearchParams({
        access_token: authResponse.access_token,
      }).toString();

      response.redirect(callbackUrl.toString());
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        response.redirect(this.getFrontendLoginUrl('google-account-not-found'));
        return;
      }

      if (error instanceof ServiceUnavailableException) {
        response.redirect(this.getFrontendLoginUrl('google-login-failed'));
        return;
      }

      throw error;
    }
  }

  @Post('logout')
  logout() {
    // Stateless JWT logout is handled on client by clearing the token.
    // If using HttpOnly Cookies, clear cookie here via Response.
    return { message: 'Logged out successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(
    @Request() req: { user: { id: string; email: string; role: string } },
  ) {
    return req.user;
  }

  private async getVerifiedGoogleEmail(code: string): Promise<string> {
    const tokenResponse = await this.requestGoogleJson(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.getOrThrow<string>(
          'GOOGLE_CLIENT_SECRET',
        ),
        redirect_uri: this.getGoogleCallbackUrl(),
        grant_type: 'authorization_code',
      }),
    });

    if (
      !isRecord(tokenResponse) ||
      typeof tokenResponse.access_token !== 'string'
    ) {
      throw new ServiceUnavailableException(
        'Google did not return an access token',
      );
    }

    const profile = await this.requestGoogleJson(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    });

    if (
      !isRecord(profile) ||
      typeof profile.sub !== 'string' ||
      typeof profile.email !== 'string' ||
      profile.email_verified !== true
    ) {
      throw new ServiceUnavailableException(
        'Google did not return a verified email address',
      );
    }

    return profile.email;
  }

  private async requestGoogleJson(
    url: string,
    init: RequestInit,
  ): Promise<unknown> {
    let response: globalThis.Response;

    try {
      response = await fetch(url, init);
    } catch {
      this.logger.error('Google OAuth provider request failed');
      throw new ServiceUnavailableException(
        'Google OAuth provider is unavailable',
      );
    }

    if (!response.ok) {
      this.logger.error(
        'Google OAuth provider rejected an authentication request',
      );
      throw new ServiceUnavailableException(
        'Google OAuth provider rejected the authentication request',
      );
    }

    try {
      return await response.json();
    } catch {
      this.logger.error('Google OAuth provider returned an invalid response');
      throw new ServiceUnavailableException(
        'Google OAuth provider returned an invalid response',
      );
    }
  }

  private hasValidOAuthState(
    state: string | undefined,
    cookieState: string | undefined,
  ): boolean {
    if (!state || !cookieState) return false;

    const received = Buffer.from(state);
    const stored = Buffer.from(cookieState);
    return (
      received.length === stored.length && timingSafeEqual(received, stored)
    );
  }

  private getCookie(request: ExpressRequest, name: string): string | undefined {
    return request.headers.cookie
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  }

  private clearGoogleStateCookie(response: ExpressResponse): void {
    response.clearCookie(GOOGLE_STATE_COOKIE, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: GOOGLE_CALLBACK_PATH,
    });
  }

  private getGoogleCallbackUrl(): string {
    return (
      this.configService.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3000/api/v1/auth/google/callback'
    );
  }

  private getFrontendUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:4200'
    );
  }

  private getFrontendLoginUrl(error: string): string {
    const loginUrl = new URL('/login', this.getFrontendUrl());
    loginUrl.searchParams.set('oauthError', error);
    return loginUrl.toString();
  }
}
