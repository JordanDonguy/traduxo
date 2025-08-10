import { geminiStream } from "@/lib/server/handlers/geminiStream";
import { NextRequest } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from '@google/genai';

type GenerateContentStreamFn = typeof GoogleGenAI.prototype.models.generateContentStream;

// ------ Mock config ------
const mockCheckQuota = jest.fn();

const mockGenAI = {
  models: {
    generateContentStream: jest.fn() as jest.MockedFunction<GenerateContentStreamFn>,
  },
};

// Async generator function that simulates Gemini's streaming chunks
async function* fakeStream(): AsyncGenerator<GenerateContentResponse> {
  yield {
    text: 'Hello',
    data: undefined,
    functionCalls: [],
    executableCode: undefined,
    codeExecutionResult: undefined,
  };
  yield {
    text: ' ',
    data: undefined,
    functionCalls: [],
    executableCode: undefined,
    codeExecutionResult: undefined,
  };
  yield {
    text: 'world!',
    data: undefined,
    functionCalls: [],
    executableCode: undefined,
    codeExecutionResult: undefined,
  };
}

// Helper to create a NextRequest with JSON body
function createRequest(body: unknown) {
  return new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as unknown as NextRequest;
}

// ------ Tests ------
describe('geminiStream', () => {
  // ------ Clear mocks before each tests ------
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it('returns 400 if validation fails', async () => {
    const req = createRequest({ prompt: '' }); // empty prompt invalid
    const res = await geminiStream(req, {
      checkQuotaFn: mockCheckQuota,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
    expect(mockCheckQuota).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it('returns 429 if quota exceeded', async () => {
    mockCheckQuota.mockResolvedValue({ allowed: false, remaining: 0 });
    const req = createRequest({ prompt: 'Hello world' });

    const res = await geminiStream(req, {
      checkQuotaFn: mockCheckQuota,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>
    });
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain('translation limit');
    expect(mockCheckQuota).toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it('returns a streaming response on success', async () => {
    mockCheckQuota.mockResolvedValue({ allowed: true, remaining: 5 });

    mockGenAI.models.generateContentStream.mockResolvedValue(fakeStream());

    const req = createRequest({ prompt: 'Say hello' });

    const res = await geminiStream(req, {
      checkQuotaFn: mockCheckQuota,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('5');

    // Read the stream content
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let done = false;

    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      if (value) {
        result += decoder.decode(value);
      }
    }

    expect(result).toBe('Hello world!');
    expect(mockCheckQuota).toHaveBeenCalled();
    expect(mockGenAI.models.generateContentStream).toHaveBeenCalledWith({
      model: 'gemini-2.5-flash-lite-preview-06-17',
      contents: 'Say hello',
    });
  });

  // ------ Test 4️⃣ ------
  it('uses model from request if provided', async () => {
    mockCheckQuota.mockResolvedValue({ allowed: true, remaining: 10 });

    mockGenAI.models.generateContentStream.mockResolvedValueOnce(fakeStream());

    const req = createRequest({
      prompt: 'Test prompt',
      model: 'custom-model-v1',
    });

    const res = await geminiStream(req, {
      checkQuotaFn: mockCheckQuota,
      genai: mockGenAI as unknown as InstanceType<typeof GoogleGenAI>
    });
    expect(res.status).toBe(200);

    expect(mockGenAI.models.generateContentStream).toHaveBeenCalledWith({
      model: 'custom-model-v1',
      contents: 'Test prompt',
    });
  });
});
