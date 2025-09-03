import { createPassword } from "@/lib/server/handlers/auth/createPassword";
import { mockPrisma } from "@/tests/jest.setup";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";
import bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('@/lib/server/middlewares/checkAuth');

describe('createPassword', () => {
  beforeEach(() => {
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: '1', email: 'user@example.com' } });
  });

  // ------ Test 1️⃣ ------
  it('returns 401 if user not authenticated', async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({ password: 'test1234' });
    const res = await createPassword(req, { prismaClient: mockPrisma });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe('Unauthorized');
  });

  // ------ Test 2️⃣ ------
  it('returns 400 if password is missing in request body', async () => {
    const req = createMockRequest({});
    const res = await createPassword(req, { prismaClient: mockPrisma });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  // ------ Test 3️⃣ ------
  it('returns 404 if user not found', async () => {

    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = createMockRequest({ password: 'test1234' });
    const res = await createPassword(req, { prismaClient: mockPrisma });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: { id: true, password: true },
    });
    expect(res.status).toBe(404);
  });

  // ------ Test 4️⃣ ------
  it('returns 401 if user already has a password', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1', password: 'hashed' });

    const req = createMockRequest({ password: 'test1234' });
    const res = await createPassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(401);
  });

  // ------ Test 5️⃣ ------
  it('hashes password and updates user then returns success', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: '1', password: null });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    mockPrisma.user.update.mockResolvedValue({});

    const req = createMockRequest({ password: 'test1234' });
    const res = await createPassword(req, { prismaClient: mockPrisma });

    expect(bcrypt.hash).toHaveBeenCalledWith('test1234', 10);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { password: 'hashedPassword', providers: ['Credentials', 'Google'] },
    });
    expect(res.status).toBe(200);
  });

  // ------ Test 6️⃣ ------
  it('returns 500 on unexpected errors', async () => {
    mockPrisma.user.findUnique.mockImplementation(() => { throw new Error('Unexpected error'); });

    const req = createMockRequest({ password: 'test1234' });
    const res = await createPassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(500);
  });
});
