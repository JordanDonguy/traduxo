import { createQuotaChecker, QUOTA, WINDOW } from '@/lib/server/dailyLimiter';
import type { NextRequest } from 'next/server';
import type { Redis } from "@upstash/redis";

type MockRedisClient = {
  get: jest.Mock<Promise<number | null>, [string]>;
  incr: jest.Mock<Promise<number>, [string]>;
  expire: jest.Mock<Promise<boolean>, [string, number]>;
  decr: jest.Mock<Promise<number>, [string]>;
};

// ------ Mock config ------
const mockRedisClient: MockRedisClient = {
  get: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  decr: jest.fn(),
};
const quotaChecker = createQuotaChecker(mockRedisClient as unknown as Redis);

// Helper to create a mock NextRequest with given IP in header key
function createRequest(ip: string, headerKey = 'cf-connecting-ip'): NextRequest {
  return {
    headers: {
      get: (key: string) => (key === headerKey ? ip : null),
    },
  } as unknown as NextRequest;
}

// ------ Tests ------
describe('createQuotaChecker', () => {
  // ------ Test 1️⃣ ------
  it('allows requests under quota and increments count', async () => {
    const req = createRequest('1.2.3.4');
    mockRedisClient.get.mockResolvedValue(10);

    const result = await quotaChecker.checkQuota(req);

    expect(mockRedisClient.get).toHaveBeenCalledWith('rl:1.2.3.4');
    expect(mockRedisClient.incr).toHaveBeenCalledWith('rl:1.2.3.4');
    expect(mockRedisClient.expire).not.toHaveBeenCalled();
    expect(result).toEqual({ allowed: true, remaining: QUOTA - 10 - 1 });
  });

  // ------ Test 2️⃣ ------
  it('sets expire when first use (used === 0)', async () => {
    const req = createRequest('5.6.7.8');
    mockRedisClient.get.mockResolvedValue(null); // no previous use

    const result = await quotaChecker.checkQuota(req);

    expect(mockRedisClient.incr).toHaveBeenCalledWith('rl:5.6.7.8');
    expect(mockRedisClient.expire).toHaveBeenCalledWith('rl:5.6.7.8', WINDOW);
    expect(result).toEqual({ allowed: true, remaining: QUOTA - 0 - 1 });
  });

  // ------ Test 3️⃣ ------
  it('blocks request when quota exceeded', async () => {
    const req = createRequest('9.10.11.12');
    mockRedisClient.get.mockResolvedValue(QUOTA);

    const result = await quotaChecker.checkQuota(req);

    expect(result).toEqual({ allowed: false, remaining: 0 });
    expect(mockRedisClient.incr).not.toHaveBeenCalled();
    expect(mockRedisClient.expire).not.toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it('calls giveBack and decrements count', async () => {
    const req = createRequest('1.2.3.4');
    await quotaChecker.giveBack(req);
    expect(mockRedisClient.decr).toHaveBeenCalledWith('rl:1.2.3.4');
  });
});
