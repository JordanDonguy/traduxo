import { createAuthOptions } from '@/lib/server/auth/authOptions';
import { prisma } from "@/lib/server/prisma";
import { createMockSession, mockToken, mockUser } from "./mocks/authMocks";
import { Session } from 'next-auth';

jest.mock('@/lib/server/prisma', () => ({
  prisma: { user: { findUnique: jest.fn() } },
}));

describe('callbacks.session', () => {
  const options = createAuthOptions({
    GOOGLE_CLIENT_ID: 'fake-id',
    GOOGLE_CLIENT_SECRET: 'fake-secret',
    JWT_SECRET: 'fake-jwt-secret',
  });

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

  // ------ Test 1️⃣ ------
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
      throw new Error('User does not have id, providers and system language');
    }
  });

  // ------ Test 2️⃣ ------
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

  // ------ Test 3️⃣ ------
  it('handles session.user undefined safely', async () => {
    const session = { ...createMockSession(), user: undefined } as unknown as Session;

    const result = await options.callbacks!.session!({
      session,
      token: mockToken,
      user: mockUser,
      newSession: undefined,
      trigger: "update",
    });

    // It should still return a session object without throwing
    expect(result).toHaveProperty('user');
    expect(result.user).toBeDefined();
  });
});