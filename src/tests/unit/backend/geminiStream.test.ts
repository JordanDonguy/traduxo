import { geminiStream } from "@/lib/server/handlers/geminiStream";
import { NextRequest } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from '@google/genai';
import { checkQuota } from "@/lib/server/dailyLimiter";
import { TranslationItem } from "../../../../types/translation";

type GenerateContentStreamFn = typeof GoogleGenAI.prototype.models.generateContentStream;

// ---- Mocks ----
const mockCheckQuotaFn = jest.fn() as jest.MockedFunction<typeof checkQuota>;
const mockGenAI = {
  models: {
    generateContentStream: jest.fn() as jest.MockedFunction<GenerateContentStreamFn>,
  },
};
const mockGetSession = jest.fn();

// ---- Helpers ----

// Create a NextRequest with JSON body
function createRequest(body: unknown) {
  return new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as unknown as NextRequest;
}

// Async generator mock for streaming chunks
function mockStream(...chunks: string[]): AsyncGenerator<GenerateContentResponse> {
  return (async function* () {
    for (const text of chunks) {
      yield { text, data: undefined, functionCalls: [], executableCode: undefined, codeExecutionResult: undefined };
    }
  })();
}

// Read full stream as text
async function readStreamAsText(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let result = '';
  let done = false;
  while (!done) {
    const { value, done: streamDone } = await reader.read();
    done = streamDone;
    if (value) result += decoder.decode(value, { stream: true });
  }
  return result;
}

// Read stream as JSON lines (translation mode)
async function readStreamAsJSON(res: Response): Promise<TranslationItem[]> {
  const text = await readStreamAsText(res);
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}


// ---- Tests ----
describe('geminiStream', () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ user: { email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it('returns 400 if validation fails', async () => {
    const res = await geminiStream(createRequest({ prompt: '' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 2️⃣ ------
  it('returns 429 if guest exceeds quota on suggestion', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await geminiStream(createRequest({ prompt: 'Hi', mode: 'suggestion' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: async () => null,
    });
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/please log in/i);
  });

  // ------ Test 3️⃣ ------
  it('returns 200 and X-RateLimit-Remaining for guest with quota', async () => {
    mockCheckQuotaFn.mockResolvedValue({ allowed: true, remaining: 5 });
    mockGenAI.models.generateContentStream.mockResolvedValue(mockStream('Test'));
    const res = await geminiStream(createRequest({ prompt: 'Hi', mode: 'suggestion' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: async () => null,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('5');
  });

  // ------ Test 4️⃣ ------
  it('streams JSON objects in translation mode', async () => {
    mockGenAI.models.generateContentStream.mockResolvedValue(
      mockStream(
        '{"type":"expression","value":"Hello"}',
        '{"type":"main_translation","value":"world!"}'
      )
    );
    const res = await geminiStream(createRequest({ prompt: 'Hi', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });
    const items = await readStreamAsJSON(res);
    expect(items).toEqual([
      { type: 'expression', value: 'Hello' },
      { type: 'main_translation', value: 'world!' },
    ]);
  });

  // ------ Test 5️⃣ ------
  it('streams plain text in explanation mode', async () => {
    mockGenAI.models.generateContentStream.mockResolvedValue(mockStream('This is ', 'an explanation.'));
    const res = await geminiStream(createRequest({ prompt: 'Explain', mode: 'explanation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });
    const result = await readStreamAsText(res);
    expect(result).toBe('This is an explanation.');
  });

  // ------ Test 6️⃣ ------
  it('skips chunks without text', async () => {
    mockGenAI.models.generateContentStream.mockResolvedValue(
      mockStream('', '{"type":"main_translation","value":"world"}')
    );
    const res = await geminiStream(createRequest({ prompt: 'Test', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });
    const items = await readStreamAsJSON(res);
    expect(items).toEqual([{ type: 'main_translation', value: 'world' }]);
  });

  // ------ Test 7️⃣ ------
  it('handles invalid JSON gracefully', async () => {
    mockGenAI.models.generateContentStream.mockResolvedValue(
      mockStream('{"type":"expression","value":Hello}') // invalid JSON
    );
    const res = await geminiStream(createRequest({ prompt: 'Test', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });
    const items = await readStreamAsJSON(res);
    expect(items).toEqual([]); // invalid JSON skipped
  });

  // ------ Test 8️⃣ ------
  it('waits when JSON is incomplete across chunks', async () => {
    mockGenAI.models.generateContentStream.mockResolvedValue(
      mockStream(
        '{"type":"expression","value":"Hel', // first chunk, incomplete JSON
        'lo"}' // second chunk completes JSON
      )
    );

    const res = await geminiStream(createRequest({ prompt: 'Test', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });

    const items = await readStreamAsJSON(res);
    expect(items).toEqual([{ type: 'expression', value: 'Hello' }]);
  });

  // ------ Test 9️⃣ ------
  it('triggers controller.error on stream exception', async () => {
    // Generator that throws
    async function* errorStream(): AsyncGenerator<GenerateContentResponse> {
      throw new Error('Stream failed');
    }

    mockGenAI.models.generateContentStream.mockResolvedValue(errorStream());

    const req = createRequest({ prompt: 'Test', mode: 'translation' });

    // Wrap call in try/catch because the stream will throw
    let caughtError: unknown;
    try {
      const res = await geminiStream(req, {
        checkQuotaFn: mockCheckQuotaFn,
        genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
        getSessionFn: mockGetSession,
      });

      // Consume the stream to trigger the error
      const reader = res.body!.getReader();
      await reader.read();
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as Error).message).toBe('Stream failed');
  });

  // ------ Test 🔟 ------
  it('uses model from request if provided', async () => {
    mockGenAI.models.generateContentStream.mockResolvedValue(mockStream('OK'));
    const res = await geminiStream(createRequest({ prompt: 'Test', model: 'custom-model-v1' }), {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });
    expect(res.status).toBe(200);
    expect(mockGenAI.models.generateContentStream).toHaveBeenCalledWith({
      model: 'custom-model-v1',
      contents: 'Test',
    });
  });

  // ------ Test 1️⃣1️⃣ ------
  it('handles Gemini API errors', async () => {
    // make generateContentStream reject
    mockGenAI.models.generateContentStream.mockRejectedValue(new Error('Stream failed'));

    const req = createRequest({ prompt: 'Test', mode: 'translation' });

    const res = await geminiStream(req, {
      checkQuotaFn: mockCheckQuotaFn,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>,
      getSessionFn: mockGetSession,
    });

    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe('Gemini API error');
    expect(data.details).toContain('Stream failed');
  });
});
