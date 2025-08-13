import { PrismaClient } from "@prisma/client/extension";

// Silence noisy console.error logs during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => { });
});

process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.UPSTASH_REDIS_REST_URL = "https://test-redis-rest-url.com"
process.env.UPSTASH_REDIS_REST_TOKEN = "test-redis-rest-token"

// ------ Define a prisma mock ------

const user = {
  findUnique: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const history = {
  create: jest.fn(),
  count: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  delete: jest.fn(),
};

const favorite = {
  create: jest.fn(),
  findMany: jest.fn(),
  findUnique: jest.fn(),
  delete: jest.fn(),
};

const prisma = {
  user,
  history,
  favorite,
  $queryRaw: jest.fn(),
};

jest.mock('@/lib/server/prisma', () => ({
  prisma,
}));

export type MockPrismaClient = Partial<PrismaClient> & {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  history: {
    create: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
  favorite: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
  $executeRaw: jest.Mock;
};

export const mockPrisma = prisma as unknown as MockPrismaClient;

// ------ Clear mocks before each tests ------
beforeEach(() => {
  jest.clearAllMocks();
});
