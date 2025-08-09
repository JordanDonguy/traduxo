import { createPassword } from "@/lib/server/handlers/createPassword";
import bcrypt from 'bcrypt';
import { mockPrisma } from "@/tests/jest.setup";

jest.mock('bcrypt');

const mockGetSession = jest.fn();

function createMockRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

describe('createPassword', () => {
  // ------ Clear mocks before each tests ------
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it('returns 401 if session is missing or email not present', async () => {
    mockGetSession.mockResolvedValue(null);
    const req = createMockRequest({ password: 'test1234' });

    const response = await createPassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('Unauthorized');
  });

  // ------ Test 2️⃣ ------
  it('returns 400 if password is missing in request body', async () => {
    mockGetSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    const req = createMockRequest({});

    const response = await createPassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 3️⃣ ------
  it('returns 404 if user not found', async () => {
    mockGetSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const req = createMockRequest({ password: 'test1234' });

    const response = await createPassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: { id: true, password: true },
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe('User not found');
  });

  // ------ Test 4️⃣ ------
  it('returns 401 if user already has a password', async () => {
    mockGetSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, password: 'hashedpass' });
    const req = createMockRequest({ password: 'test1234' });

    const response = await createPassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe('User already has a password');
  });

  // ------ Test 5️⃣ ------
  it('hashes password and updates user then returns success', async () => {
    mockGetSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, password: null });
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    mockPrisma.user.update.mockResolvedValue({});

    const req = createMockRequest({ password: 'test1234' });

    const response = await createPassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('test1234', 10);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { password: 'hashedPassword', providers: ['Credentials', 'Google'] },
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  // ------ Test 6️⃣ ------
  it('returns 400 if Zod validation fails', async () => {
    mockGetSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    // Sending an invalid body to cause ZodError, e.g. password as number instead of string
    const req = createMockRequest({ password: 1234 });

    const response = await createPassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 7️⃣ ------
  it('returns 500 on unexpected errors', async () => {
    mockGetSession.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const req = createMockRequest({ password: 'test1234' });

    const response = await createPassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe('Internal Server Error');
  });
});
