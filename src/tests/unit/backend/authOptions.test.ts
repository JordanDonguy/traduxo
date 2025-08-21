jest.mock('@/lib/server/auth/handleGoogleSignIn');

import { createAuthOptions } from '@/lib/server/auth/authOptions';
import { handleGoogleSignIn } from '@/lib/server/auth/handleGoogleSignIn';
import { prisma } from "@/lib/server/prisma";
import type { User, Account, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "next-auth/adapters";

// ------------- Mock config -------------
function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user1",
    name: "Test User",
    email: "test@gmail.com",
    image: undefined,
    ...overrides,
  }
};

function createMockAccount(overrides?: Partial<Account>): Account {
  return {
    provider: "google",
    type: "oauth",
    providerAccountId: "google-id-123",
    ...overrides,
  }
};

function createMockSession(overrides?: Partial<Session>): Session {
  return {
    expires: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
    user: {
      email: "test@example.com",
      id: "1234",
      providers: undefined,
      systemLang: "en",
      ...overrides?.user,
    },
    ...overrides,
  }
};

const mockToken: JWT = {
  sub: "user1",
  name: "Test User",
  email: "test@example.com",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  jti: "random-jti",
};

const mockUser: AdapterUser = {
  id: "user1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: null,
  image: null,
};

// ------------- Tests -------------
describe('createAuthOptions', () => {
  const mockEnv = {
    GOOGLE_CLIENT_ID: 'fake-id',
    GOOGLE_CLIENT_SECRET: 'fake-secret',
    JWT_SECRET: 'fake-jwt-secret',
  };

  const options = createAuthOptions(mockEnv);

  // ------ Test 1️⃣ ------
  it('should return providers including credentials and google', () => {
    expect(options.providers.length).toBe(2);
    expect(options.providers[0].id).toBe('credentials');
    expect(options.providers[1].id).toBe('google');
  });

  describe('callbacks.signIn', () => {
    // ------ Test 2️⃣ ------
    it('returns false if no account', async () => {
      const user = createMockUser();
      const res = await options.callbacks!.signIn!({ user, account: null });
      expect(res).toBe(false);
    });

    // -> 'credentials' provider signIn cases are tested separately in authorizeUser.test.ts

    // ------ Test 3️⃣ ------
    it('calls handleGoogleSignIn for google account', async () => {
      (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: true });
      const user = createMockUser();
      const account = createMockAccount();
      const res = await options.callbacks!.signIn!({ user, account });
      expect(handleGoogleSignIn).toHaveBeenCalledWith('test@gmail.com');
      expect(res).toBe(true);
    });

    // ------ Test 4️⃣ ------
    it('throws if handleGoogleSignIn fails', async () => {
      (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: 'fail' });
      const user = createMockUser();
      const account = createMockAccount();
      await expect(options.callbacks!.signIn!({ user, account })).rejects.toThrow('fail');
    });

    // ------ Test 5️⃣ ------
    it('redirects to /link-google if NeedGoogleLinking', async () => {
      (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: 'NeedGoogleLinking' });
      const user = createMockUser();
      const account = createMockAccount();

      const res = await options.callbacks!.signIn!({ user, account });

      expect(res).toBe('/link-google');
    });

    // ------ Test 6️⃣ ------
    it('returns true for other providers', async () => {
      const user = createMockUser();
      const account = createMockAccount({ provider: 'credentials', type: 'credentials' });
      const res = await options.callbacks!.signIn!({ user, account });
      expect(res).toBe(true);
    });
  });

  describe('callbacks.session', () => {
    beforeEach(() => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: '123',
        email: 'test@example.com',
        password: null,
        providers: ['credentials'],
        systemLang: "en",
        createdAt: new Date(),
        google_linking: null,
      });
    });

    // ------ Test 7️⃣ ------
    it('adds user id, providers and systemLang to session when found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-id', providers: ['google'], systemLang: "en" });
      const session = createMockSession()
      const result = await options.callbacks!.session!({
        session,
        token: mockToken,
        user: mockUser,
        newSession: undefined,
        trigger: "update",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, providers: true, systemLang: true },
      });

      if (result.user && 'id' in result.user && 'providers' in result.user && result.user && "systemLang" in result.user) {
        expect(result.user.id).toBe('user-id');
        expect(result.user.providers).toEqual(['google']);
        expect(result.user.systemLang).toEqual("en");
      } else {
        // Fail the test explicitly if user shape is unexpected
        throw new Error('User does not have id, providers and system language');
      }
    });

    // ------ Test 8️⃣ ------
    it('returns session unchanged if no user found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const session = createMockSession();
      const result = await options.callbacks!.session!({
        session,
        token: mockToken,
        user: mockUser,
        newSession: undefined,
        trigger: "update",
      });
      expect(result).toEqual(session);
    });
  });

  describe('callbacks.jwt', () => {
    // ------ Test 9️⃣ ------
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

    // ------ Test 🔟 ------
    it('returns token unchanged if no user', async () => {
      const token = { sub: 'abc' };
      const user = createMockUser();
      if (!options.callbacks?.jwt) {
        throw new Error('JWT callback is not defined');
      }
      const result = await options.callbacks.jwt({
        token,
        user,
        account: null,
      });
      expect(result).toEqual(token);
    });
  });
});
