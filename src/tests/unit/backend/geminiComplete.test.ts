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

const mockGetSession = jest.fn();

const makeRequest = (body: unknown) =>
  new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

// ------ Tests ------
describe('geminiComplete', () => {
  beforeEach(() => {
     mockGetSession.mockResolvedValue({ user: { email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it('returns 400 if prompt is missing', async () => {
    const req = makeRequest({});

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: async () => null, // guest
    });

    expect(res.status).toBe(400);
  });

  // ------ Test 2️⃣ ------
  it('returns 429 if guest exceeds quota on suggestion', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: false, remaining: 0 });

    const req = makeRequest({ prompt: 'hello', isSuggestion: true });

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: async () => null, // guest
    });

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/please log in/i);
  });

  // ------ Test 3️⃣ ------
  it('calls Gemini API and returns text on success for guest', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: true, remaining: 42 });
    mockGenai.models.generateContent.mockResolvedValue(
      { text: 'fake-response' } as Awaited<ReturnType<GenerateContentFn>>
    );

    const req = makeRequest({ prompt: 'translate this', isSuggestion: true });

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: async () => null, // guest
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
  it('skips quota when logged in even if isSuggestion', async () => {
    mockGenai.models.generateContent.mockResolvedValue(
      { text: 'logged-in-response' } as Awaited<ReturnType<GenerateContentFn>>
    );

    const req = makeRequest({ prompt: 'translate this', isSuggestion: true });

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });

    // Quota should not be called
    expect(mockCheckQuotaFn).not.toHaveBeenCalled();

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe('logged-in-response');
  });

  // ------ Test 5️⃣ ------
  it('handles Gemini API errors', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: true, remaining: 10 });
    mockGenai.models.generateContent.mockRejectedValue(new Error('API failed'));

    const req = makeRequest({ prompt: 'something', isSuggestion: true });

    const res = await geminiComplete(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: async () => null, // guest
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Gemini API error');
    expect(data.details).toContain('API failed');
  });
});
