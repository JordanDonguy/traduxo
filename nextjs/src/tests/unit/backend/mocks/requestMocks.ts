export function createMockRequest(body: unknown, headers: Record<string, string> = {}) {
  const reqHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    reqHeaders.set(key, value);
  });
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: reqHeaders,
  } as unknown as Request;
}
