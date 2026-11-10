jest.mock('@moto-monorepo/services', () => ({
  LoggerService: class LoggerService {},
}));

import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    loginWithGoogle: jest.fn(),
  };
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
  };
  const configValues: Record<string, string> = {};
  const configService = {
    get: jest.fn((key: string) => configValues[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = configValues[key];
      if (value === undefined) throw new Error(`Missing config: ${key}`);
      return value;
    }),
  };
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  };
  const validState = 'a'.repeat(64);
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(configValues, {
      GOOGLE_CLIENT_ID: 'google-client-id',
      GOOGLE_CLIENT_SECRET: 'google-client-secret',
      GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/google/callback',
      FRONTEND_URL: 'https://frontend.example.test',
      NODE_ENV: 'test',
    });
    controller = new AuthController(
      authService as never,
      logger as never,
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the auth endpoints and protects the profile endpoint with JWT', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AuthController)).toBe('auth');
    expect(
      Reflect.getMetadata(PATH_METADATA, AuthController.prototype.register),
    ).toBe('register');
    expect(
      Reflect.getMetadata(PATH_METADATA, AuthController.prototype.login),
    ).toBe('login');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AuthController.prototype.startGoogleLogin,
      ),
    ).toBe('google');
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        AuthController.prototype.completeGoogleLogin,
      ),
    ).toBe('google/callback');
    expect(
      Reflect.getMetadata(PATH_METADATA, AuthController.prototype.logout),
    ).toBe('logout');
    expect(
      Reflect.getMetadata(PATH_METADATA, AuthController.prototype.getProfile),
    ).toBe('profile');
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AuthController.prototype.getProfile),
    ).toEqual([expect.any(Function)]);
    expect(
      Reflect.getMetadata(METHOD_METADATA, AuthController.prototype.getProfile),
    ).toBe(0);
  });

  it('registers a user and logs the attempt', () => {
    const dto = { email: 'rider@example.com' } as never;
    authService.register.mockReturnValue('registered');

    expect(controller.register(dto)).toBe('registered');
    expect(authService.register).toHaveBeenCalledWith(dto);
    expect(logger.log).toHaveBeenCalledWith(
      'Registering new user with email: rider@example.com',
    );
  });

  it('logs in a user and logs the attempt', () => {
    const dto = { email: 'rider@example.com' } as never;
    authService.login.mockReturnValue('logged-in');

    expect(controller.login(dto)).toBe('logged-in');
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(logger.log).toHaveBeenCalledWith(
      'Login attempt for email: rider@example.com',
    );
  });

  it('logs out without server-side token state', () => {
    expect(controller.logout()).toEqual({ message: 'Logged out successfully' });
  });

  it('returns the authenticated user profile', () => {
    const user = { id: 'user-id', email: 'rider@example.com', role: 'USER' };

    expect(controller.getProfile({ user })).toBe(user);
  });

  it('starts authorization with a random state bound to an HttpOnly cookie', () => {
    controller.startGoogleLogin(response as never);

    const [redirectUrl] = response.redirect.mock.calls[0];
    const authorizationUrl = new URL(redirectUrl);
    const [cookieName, cookieState, cookieOptions] =
      response.cookie.mock.calls[0];

    expect(authorizationUrl.origin).toBe('https://accounts.google.com');
    expect(authorizationUrl.pathname).toBe('/o/oauth2/v2/auth');
    expect(authorizationUrl.searchParams.get('client_id')).toBe(
      'google-client-id',
    );
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      configValues.GOOGLE_CALLBACK_URL,
    );
    expect(authorizationUrl.searchParams.get('response_type')).toBe('code');
    expect(authorizationUrl.searchParams.get('scope')).toBe(
      'openid email profile',
    );
    expect(cookieName).toBe('google_oauth_state');
    expect(cookieState).toBe(authorizationUrl.searchParams.get('state'));
    expect(cookieState).toHaveLength(64);
    expect(cookieOptions).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/api/v1/auth/google/callback',
    });
  });

  it('uses the callback URL fallback and secure cookies in production', () => {
    delete configValues.GOOGLE_CALLBACK_URL;
    configValues.NODE_ENV = 'production';

    controller.startGoogleLogin(response as never);

    const authorizationUrl = new URL(response.redirect.mock.calls[0][0]);
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3000/api/v1/auth/google/callback',
    );
    expect(response.cookie.mock.calls[0][2]).toMatchObject({ secure: true });
  });

  it.each(['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'])(
    'rejects starting Google login when %s is missing',
    (missingConfig) => {
      delete configValues[missingConfig];

      expect(() => controller.startGoogleLogin(response as never)).toThrow(
        ServiceUnavailableException,
      );
      expect(response.cookie).not.toHaveBeenCalled();
      expect(response.redirect).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      description: 'provider error',
      query: {
        error: 'access_denied',
        code: 'authorization-code',
        state: validState,
      },
      cookie: `google_oauth_state=${validState}`,
    },
    {
      description: 'missing authorization code',
      query: { state: validState },
      cookie: `google_oauth_state=${validState}`,
    },
    {
      description: 'missing state',
      query: { code: 'authorization-code' },
      cookie: `google_oauth_state=${validState}`,
    },
    {
      description: 'missing state cookie',
      query: { code: 'authorization-code', state: validState },
      cookie: undefined,
    },
    {
      description: 'mismatched state values',
      query: { code: 'authorization-code', state: validState },
      cookie: `google_oauth_state=${'b'.repeat(64)}`,
    },
    {
      description: 'state values with different byte lengths',
      query: { code: 'authorization-code', state: 'short' },
      cookie: `google_oauth_state=${validState}`,
    },
    {
      description: 'non-string authorization code and state',
      query: { code: ['authorization-code'], state: ['state'] },
      cookie: `google_oauth_state=${validState}`,
    },
  ])('rejects callback with $description', async ({ query, cookie }) => {
    await controller.completeGoogleLogin(
      { headers: cookie ? { cookie } : {} } as never,
      response as never,
      query,
    );

    expect(response.clearCookie).toHaveBeenCalledWith(
      'google_oauth_state',
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/auth/google/callback',
      }),
    );
    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed'),
    );
    expect(authService.loginWithGoogle).not.toHaveBeenCalled();
  });

  it('uses the frontend URL fallback for login errors', async () => {
    delete configValues.FRONTEND_URL;

    await controller.completeGoogleLogin(
      { headers: {} } as never,
      response as never,
      { code: 'authorization-code' },
    );

    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed', 'http://localhost:4200'),
    );
  });

  it('exchanges Google identity for an application token and redirects to the SPA', async () => {
    authService.loginWithGoogle.mockResolvedValue({
      user: {
        id: 'user-id',
        email: 'rider@example.com',
        role: 'USER',
      },
      access_token: 'application-token',
    });
    const fetch = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'google-access-token' })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sub: 'google-user-id',
            email: 'rider@example.com',
            email_verified: true,
          }),
        ),
      );

    await controller.completeGoogleLogin(
      {
        headers: {
          cookie: `another=value; google_oauth_state=${validState}`,
        },
      } as never,
      response as never,
      { code: 'authorization-code', state: validState },
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][0]).toBe('https://oauth2.googleapis.com/token');
    expect(fetch.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const tokenBody = new URLSearchParams(
      fetch.mock.calls[0][1]?.body as string,
    );
    expect(Object.fromEntries(tokenBody)).toEqual({
      code: 'authorization-code',
      client_id: 'google-client-id',
      client_secret: 'google-client-secret',
      redirect_uri: configValues.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    });
    expect(fetch.mock.calls[1][0]).toBe(
      'https://openidconnect.googleapis.com/v1/userinfo',
    );
    expect(fetch.mock.calls[1][1]?.headers).toEqual({
      Authorization: 'Bearer google-access-token',
    });
    expect(authService.loginWithGoogle).toHaveBeenCalledWith(
      'rider@example.com',
    );
    const redirectUrl = new URL(response.redirect.mock.calls[0][0]);
    expect(redirectUrl.origin).toBe(new URL(configValues.FRONTEND_URL).origin);
    expect(redirectUrl.pathname).toBe('/auth/callback');
    expect(
      new URLSearchParams(redirectUrl.hash.slice(1)).get('access_token'),
    ).toBe('application-token');
  });

  it('redirects an unknown Google account back to login', async () => {
    authService.loginWithGoogle.mockRejectedValue(new UnauthorizedException());
    mockGoogleProfile();

    await callValidCallback();

    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-account-not-found'),
    );
  });

  it('redirects provider and token failures back to login', async () => {
    authService.loginWithGoogle.mockRejectedValue(
      new ServiceUnavailableException(),
    );
    mockGoogleProfile();

    await callValidCallback();

    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed'),
    );
  });

  it('rethrows unexpected errors from the login service', async () => {
    authService.loginWithGoogle.mockRejectedValue(new Error('unexpected'));
    mockGoogleProfile();

    await expect(callValidCallback()).rejects.toThrow('unexpected');
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it.each([
    ['missing access token', {}],
    ['non-string access token', { access_token: 1 }],
    ['non-object token response', null],
  ])('rejects a Google token response with %s', async (_description, body) => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(JSON.stringify(body)));

    await callValidCallback();

    expect(authService.loginWithGoogle).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed'),
    );
  });

  it.each([
    ['missing subject', { email: 'rider@example.com', email_verified: true }],
    [
      'non-string subject',
      { sub: 1, email: 'rider@example.com', email_verified: true },
    ],
    ['missing email', { sub: 'google-user-id', email_verified: true }],
    [
      'non-string email',
      { sub: 'google-user-id', email: 1, email_verified: true },
    ],
    [
      'unverified email',
      {
        sub: 'google-user-id',
        email: 'rider@example.com',
        email_verified: false,
      },
    ],
    ['non-object profile', null],
  ])('rejects a Google profile with %s', async (_description, profile) => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'google-access-token' })),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(profile)));

    await callValidCallback();

    expect(authService.loginWithGoogle).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed'),
    );
  });

  it('logs and handles a network error from Google', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network error'));

    await callValidCallback();

    expect(logger.error).toHaveBeenCalledWith(
      'Google OAuth provider request failed',
    );
    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed'),
    );
  });

  it('logs and handles a rejected Google response', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 500 }));

    await callValidCallback();

    expect(logger.error).toHaveBeenCalledWith(
      'Google OAuth provider rejected an authentication request',
    );
    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed'),
    );
  });

  it('logs and handles invalid JSON from Google', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
    } as unknown as Response);

    await callValidCallback();

    expect(logger.error).toHaveBeenCalledWith(
      'Google OAuth provider returned an invalid response',
    );
    expect(response.redirect).toHaveBeenCalledWith(
      getFrontendLoginUrl('google-login-failed'),
    );
  });

  function mockGoogleProfile(): jest.SpyInstance {
    return jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'google-access-token' })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sub: 'google-user-id',
            email: 'rider@example.com',
            email_verified: true,
          }),
        ),
      );
  }

  function callValidCallback(): Promise<void> {
    return controller.completeGoogleLogin(
      { headers: { cookie: `google_oauth_state=${validState}` } } as never,
      response as never,
      { code: 'authorization-code', state: validState },
    );
  }

  function getFrontendLoginUrl(
    error: string,
    frontendUrl = configValues.FRONTEND_URL,
  ): string {
    const loginUrl = new URL('/login', frontendUrl);
    loginUrl.searchParams.set('oauthError', error);
    return loginUrl.toString();
  }
});
