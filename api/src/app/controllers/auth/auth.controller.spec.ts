jest.mock('@moto-monorepo/services', () => ({
  LoggerService: class LoggerService {},
}));

import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';

describe('AuthController Google OAuth', () => {
  const authService = {
    loginWithGoogle: jest.fn(),
  };
  const logger = {
    log: jest.fn(),
    error: jest.fn(),
  };
  const configValues: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/google/callback',
    FRONTEND_URL: 'http://localhost:4200',
    NODE_ENV: 'test',
  };
  const configService = {
    get: jest.fn((key: string) => configValues[key]),
    getOrThrow: jest.fn((key: string) => configValues[key]),
  };
  const response = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  };
  let controller: AuthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthController(
      authService as never,
      logger as never,
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts authorization with a random state bound to an HttpOnly cookie', () => {
    controller.startGoogleLogin(response as never);

    const [redirectUrl] = response.redirect.mock.calls[0];
    const authorizationUrl = new URL(redirectUrl);
    const [cookieName, cookieState, cookieOptions] =
      response.cookie.mock.calls[0];

    expect(authorizationUrl.origin).toBe('https://accounts.google.com');
    expect(authorizationUrl.searchParams.get('client_id')).toBe(
      'google-client-id',
    );
    expect(authorizationUrl.searchParams.get('redirect_uri')).toBe(
      configValues.GOOGLE_CALLBACK_URL,
    );
    expect(authorizationUrl.searchParams.get('response_type')).toBe('code');
    expect(cookieName).toBe('google_oauth_state');
    expect(cookieState).toBe(authorizationUrl.searchParams.get('state'));
    expect(cookieState).toHaveLength(64);
    expect(cookieOptions).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/v1/auth/google/callback',
    });
  });

  it('rejects callbacks without a matching state cookie', async () => {
    await controller.completeGoogleLogin(
      { headers: { cookie: 'google_oauth_state=wrong-state' } } as never,
      response as never,
      { code: 'authorization-code', state: 'expected-state' },
    );

    expect(response.clearCookie).toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      'http://localhost:4200/login?oauthError=google-login-failed',
    );
    expect(authService.loginWithGoogle).not.toHaveBeenCalled();
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
    jest
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
      { headers: { cookie: `google_oauth_state=${'a'.repeat(64)}` } } as never,
      response as never,
      { code: 'authorization-code', state: 'a'.repeat(64) },
    );

    expect(authService.loginWithGoogle).toHaveBeenCalledWith(
      'rider@example.com',
    );
    const redirectUrl = new URL(response.redirect.mock.calls[0][0]);
    expect(redirectUrl.origin).toBe('http://localhost:4200');
    expect(redirectUrl.pathname).toBe('/auth/callback');
    expect(
      new URLSearchParams(redirectUrl.hash.slice(1)).get('access_token'),
    ).toBe('application-token');
  });
});
