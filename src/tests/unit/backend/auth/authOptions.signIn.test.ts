import { createAuthOptions } from '@/lib/server/auth/authOptions';
import { handleGoogleSignIn } from '@/lib/server/auth/handleGoogleSignIn';
import { createMockUser, createMockAccount } from "../mocks/authMocks";

// ---- Mock Config ----
jest.mock('@/lib/server/auth/handleGoogleSignIn');
jest.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    refreshToken: { create: jest.fn() },
  },
}));

// ---- Tests ----
describe('callbacks.signIn', () => {
  const options = createAuthOptions({
    GOOGLE_CLIENT_ID: 'fake-id',
    GOOGLE_CLIENT_SECRET: 'fake-secret',
    JWT_SECRET: 'fake-jwt-secret',
  });

  // ------ Test 1️⃣ ------
  it('returns false if no account', async () => {
    const user = createMockUser();
    const res = await options.callbacks!.signIn!({ user, account: null });
    expect(res).toBe(false);
  });

  // ------ Test 2️⃣ ------
  it('calls handleGoogleSignIn for google account', async () => {
    (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: true, userId: 'user1' });
    const user = createMockUser();
    const account = createMockAccount();
    const res = await options.callbacks!.signIn!({ user, account });
    expect(handleGoogleSignIn).toHaveBeenCalledWith('test@gmail.com');
    expect(res).toBe(true);
  });

  // ------ Test 3️⃣ ------
  it('throws if handleGoogleSignIn fails', async () => {
    (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: 'fail' });
    const user = createMockUser();
    const account = createMockAccount();
    await expect(options.callbacks!.signIn!({ user, account })).rejects.toThrow('fail');
  });

  // ------ Test 4️⃣ ------
  it('redirects to /link-google if NeedGoogleLinking', async () => {
    (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: 'NeedGoogleLinking' });
    const user = createMockUser();
    const account = createMockAccount();
    const res = await options.callbacks!.signIn!({ user, account });
    expect(res).toBe('/link-google');
  });

  // ------ Test 5️⃣ ------
  it('returns true for other providers', async () => {
    const user = createMockUser();
    const account = createMockAccount({ provider: 'credentials', type: 'credentials' });
    const res = await options.callbacks!.signIn!({ user, account });
    expect(res).toBe(true);
  });
});
