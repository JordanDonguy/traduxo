import { geminiComplete } from "@/lib/server/handlers/geminiComplete";
import { checkQuota } from '@/lib/server/dailyLimiter';
import { GoogleGenAI } from '@google/genai';

type GenerateContentFn = typeof GoogleGenAI.prototype.models.generateContent;

// ------ Mock config ------
const mockCheckQuotaFn = jest.fn() as jest.MockedFunction<typeof checkQuota>;

const mockGenai = {
  models: {
    generateContent: jest.fn() as jest.MockedFunction<GenerateContentFn>,
  },
};

const makeRequest = (body: unknown) =>
  new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

// ------ Tests------
describe('geminiComplete', () => {
  // ------ Test 1️⃣ ------
  it('returns 400 if prompt is missing', async () => {
    const req = makeRequest({});

    // We cast our partial mock to `GoogleGenAI` instance to satisfy the handler's type,
    // even though the mock only implements some methods. This is a common pattern
    // to trick TypeScript while keeping type safety on mocked methods.
    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
    });

    expect(res.status).toBe(400);
  });

  // ------ Test 2️⃣ ------
  it('returns 429 if quota exceeded', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: false, remaining: 0 });

    const req = makeRequest({ prompt: 'hello' });

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
    });

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/translation limit/i);
  });

  // ------ Test 3️⃣ ------
  it('calls Gemini API and returns text on success', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: true, remaining: 42 });
    mockGenai.models.generateContent.mockResolvedValue(
      { text: 'fake-response' } as Awaited<ReturnType<GenerateContentFn>>
    );

    const req = makeRequest({ prompt: 'translate this' });

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
    });

    expect(mockGenai.models.generateContent).toHaveBeenCalledWith({
      model: expect.any(String),
      contents: 'translate this',
      config: expect.any(Object),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('42');

    const data = await res.json();
    expect(data.text).toBe('fake-response');
  });

  // ------ Test 4️⃣ ------
  it('handles Gemini API errors', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: true, remaining: 10 });
    mockGenai.models.generateContent.mockRejectedValue(new Error('API failed'));

    const req = makeRequest({ prompt: 'something' });

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Gemini API error');
    expect(data.details).toContain('API failed');
  });
});
