import { createAuthOptions } from '@/lib/server/auth/authOptions';
import { createMockUser, mockToken, createMockAccount, UserWithRefreshToken } from "./mocks/authMocks";
import { User } from 'next-auth';

describe('callbacks.jwt', () => {
  const options = createAuthOptions({
    GOOGLE_CLIENT_ID: 'fake-id',
    GOOGLE_CLIENT_SECRET: 'fake-secret',
    JWT_SECRET: 'fake-jwt-secret',
  });

  // ------ Test 1️⃣ ------
  it('sets token.sub to user.id on first sign in', async () => {
    const token = mockToken;
    const user = createMockUser();
    const account = createMockAccount();
    if (!options.callbacks?.jwt) {
      throw new Error('JWT callback is not defined');
    };
    const result = await options.callbacks?.jwt({ token, user, account });
    expect(result.sub).toBe('user1');
  });

  // ------ Test 2️⃣ ------
  it('adds refreshToken to JWT if user has one', async () => {
    const token = { sub: 'abc' };
    const userWithToken: UserWithRefreshToken = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: null,
      image: null,
      refreshToken: 'my-refresh-token',
    };

    if (!options.callbacks?.jwt) throw new Error('JWT callback not defined');

    const result = await options.callbacks.jwt({
      token,
      user: userWithToken,
      account: null,
    });

    expect(result.sub).toBe('user1');
    expect(result.refreshToken).toBe('my-refresh-token');
  });

  // ------ Test 3️⃣ ------
  it('returns token unchanged if no user provided', async () => {
    const token = { sub: 'abc', someField: 'keep-me' };

    if (!options.callbacks?.jwt) {
      throw new Error('JWT callback is not defined');
    }

    const result = await options.callbacks.jwt({
      token,
      user: undefined as unknown as User,
      account: null,
    });

    // Nothing should change
    expect(result).toEqual(token);
  });
});

