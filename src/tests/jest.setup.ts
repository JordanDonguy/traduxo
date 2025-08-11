import { PrismaClient } from "@prisma/client/extension";
import { prisma } from "@/lib/server/prisma";

// Silence noisy console.error logs during tests
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.UPSTASH_REDIS_REST_URL="https://test-redis-rest-url.com"
process.env.UPSTASH_REDIS_REST_TOKEN="test-redis-rest-token"

jest.mock('@/lib/server/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    history: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    }
  },
}));

// Optionally create and export mockPrisma to reuse if needed:
export type MockPrismaClient = Partial<PrismaClient> & {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  history: {
    create: jest.Mock;
    deleteMany: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    delete: jest.Mock;
  }
};

export const mockPrisma = prisma as unknown as MockPrismaClient;

beforeEach(() => {
  jest.clearAllMocks();
});
