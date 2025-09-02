import type { User, Account, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { AdapterUser } from "next-auth/adapters";

export interface UserWithRefreshToken extends AdapterUser {
  refreshToken?: string;
}

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: "user1",
    name: "Test User",
    email: "test@gmail.com",
    image: undefined,
    ...overrides,
  };
}

export function createMockAccount(overrides?: Partial<Account>): Account {
  return {
    provider: "google",
    type: "oauth",
    providerAccountId: "google-id-123",
    ...overrides,
  };
}

export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
    user: {
      email: "test@example.com",
      id: "1234",
      providers: undefined,
      systemLang: "en",
      ...overrides?.user,
    },
    ...overrides,
  } as Session;
}

export const mockToken: JWT = {
  sub: "user1",
  name: "Test User",
  email: "test@example.com",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  jti: "random-jti",
};

export const mockUser: AdapterUser = {
  id: "user1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: null,
  image: null,
};
