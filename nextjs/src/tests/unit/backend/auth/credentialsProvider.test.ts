import { createAuthOptions } from '@/lib/server/auth/authOptions';
import { prisma } from "@/lib/server/prisma";
import { authorizeUser } from '@/lib/server/auth/authorizeUser';
import { CredentialsConfig } from 'next-auth/providers/credentials';
import type { NextApiRequest } from 'next';

// ---- Mock config ----
jest.mock('@/lib/server/auth/authorizeUser');
jest.mock('@/lib/server/prisma', () => ({
  prisma: {
    refreshToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock('next-auth/providers/credentials', () => {
  return {
    __esModule: true,
    default: jest.fn((config) => ({
      ...config,
      authorize: config.authorize,
    })),
  };
});

// ---- Tests ----
describe('Credentials provider authorize', () => {
  const options = createAuthOptions({
    GOOGLE_CLIENT_ID: 'fake-id',
    GOOGLE_CLIENT_SECRET: 'fake-secret',
    JWT_SECRET: 'fake-jwt-secret',
  });

  beforeEach(() => {
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});
  });

  // ------ Test 1️⃣ ------
  it('calls authorizeUser and creates refresh token', async () => {
    // Mock authorizeUser to return a user
    (authorizeUser as jest.Mock).mockResolvedValue({
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
    });

    const credentials = { email: 'test@example.com', password: 'password123' };

    // Get the credentials provider
    const credentialsProvider = options.providers!.find(
      (p): p is CredentialsConfig => p.id === 'credentials'
    )!;

    // Minimal typed request object
    const mockReq = {
      body: credentials,
    } as Partial<NextApiRequest>;

    // Call authorize
    const result = await credentialsProvider.authorize!(credentials, mockReq);

    // Assertions
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('refreshToken');
    expect(result?.email).toBe('test@example.com');

    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user1',
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    );
  });

  // ------ Test 2️⃣ ------
  it('returns null if authorizeUser returns null', async () => {
    (authorizeUser as jest.Mock).mockResolvedValue(null);
    const credentials = { email: 'test@example.com', password: 'password123' };
    const credentialsProvider = options.providers!.find(
      (p): p is CredentialsConfig => p.id === 'credentials'
    )!;

    // Minimal typed request object
    const mockReq = {
      body: credentials,
    } as Partial<NextApiRequest>;

    // Call authorize
    const result = await credentialsProvider.authorize!(credentials, mockReq);

    expect(result).toBeNull();
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
});
