import type { TranslationItem } from "@traduxo/packages/types/translation";
import type Groq from "groq-sdk";
import type { NextRequest } from 'next/server';
import type { checkQuota } from "@/lib/server/dailyLimiter";
import { aiStream } from "@/lib/server/handlers/ai/aiStream";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

// ---- Mocks ----
jest.mock('@/lib/server/middlewares/checkAuth');
const mockCheckQuotaFn = jest.fn() as jest.MockedFunction<typeof checkQuota>;

const mockGroq = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
  audio: {
    transcriptions: {
      create: jest.fn(),
    },
  },
};

// ---- Helpers ----
function createRequest(body: unknown) {
  return new Request('http://localhost/api', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  }) as unknown as NextRequest;
}

// Build a Groq-style streaming async iterator from delta strings
function mockStream(...deltas: string[]) {
  return (async function* () {
    for (const content of deltas) {
      yield { choices: [{ delta: { content } }] };
    }
  })();
}

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
describe('aiStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "user1", email: "user@example.com" } });
  });

  it('returns 400 if validation fails', async () => {
    const res = await aiStream(createRequest({ prompt: '' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it('returns 429 if guest exceeds quota on suggestion', async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    mockCheckQuotaFn.mockResolvedValue({ allowed: false, remaining: 0 });
    const res = await aiStream(createRequest({ prompt: 'Hi', mode: 'suggestion' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toMatch(/please log in/i);
  });

  it('returns 200 and X-RateLimit-Remaining for guest with quota', async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    mockCheckQuotaFn.mockResolvedValue({ allowed: true, remaining: 5 });
    mockGroq.chat.completions.create.mockResolvedValue(mockStream('Test'));
    const res = await aiStream(createRequest({ prompt: 'Hi', mode: 'suggestion' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('5');
  });

  it('streams JSON objects in translation mode', async () => {
    mockGroq.chat.completions.create.mockResolvedValue(
      mockStream(
        '{"type":"expression","value":"Hello"}',
        '{"type":"main_translation","value":"world!"}'
      )
    );
    const res = await aiStream(createRequest({ prompt: 'Hi', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    const items = await readStreamAsJSON(res);
    expect(items).toEqual([
      { type: 'expression', value: 'Hello' },
      { type: 'main_translation', value: 'world!' },
    ]);
  });

  it('streams plain text in explanation mode', async () => {
    mockGroq.chat.completions.create.mockResolvedValue(mockStream('This is ', 'an explanation.'));
    const res = await aiStream(createRequest({ prompt: 'Explain', mode: 'explanation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    const result = await readStreamAsText(res);
    expect(result).toBe('This is an explanation.');
  });

  it('skips chunks without delta content', async () => {
    mockGroq.chat.completions.create.mockResolvedValue(
      mockStream('', '{"type":"main_translation","value":"world"}')
    );
    const res = await aiStream(createRequest({ prompt: 'Test', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    const items = await readStreamAsJSON(res);
    expect(items).toEqual([{ type: 'main_translation', value: 'world' }]);
  });

  it('handles invalid JSON gracefully', async () => {
    mockGroq.chat.completions.create.mockResolvedValue(
      mockStream('{"type":"expression","value":Hello}') // invalid JSON
    );
    const res = await aiStream(createRequest({ prompt: 'Test', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    const items = await readStreamAsJSON(res);
    expect(items).toEqual([]);
  });

  it('waits when JSON is incomplete across chunks', async () => {
    mockGroq.chat.completions.create.mockResolvedValue(
      mockStream(
        '{"type":"expression","value":"Hel',
        'lo"}'
      )
    );

    const res = await aiStream(createRequest({ prompt: 'Test', mode: 'translation' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });

    const items = await readStreamAsJSON(res);
    expect(items).toEqual([{ type: 'expression', value: 'Hello' }]);
  });

  it('triggers controller.error on stream exception', async () => {
    const errorStream = {
      [Symbol.asyncIterator]() {
        return {
          next: () => Promise.reject(new Error('Stream failed')),
        };
      },
    };

    mockGroq.chat.completions.create.mockResolvedValue(errorStream);

    const req = createRequest({ prompt: 'Test', mode: 'translation' });

    let caughtError: unknown;
    try {
      const res = await aiStream(req, {
        checkQuotaFn: mockCheckQuotaFn,
        groq: mockGroq as unknown as Groq,
      });
      const reader = res.body!.getReader();
      await reader.read();
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as Error).message).toBe('Stream failed');
  });

  it('uses model from request if provided', async () => {
    mockGroq.chat.completions.create.mockResolvedValue(mockStream('OK'));
    const res = await aiStream(createRequest({ prompt: 'Test', model: 'custom-model-v1' }), {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });
    expect(res.status).toBe(200);
    expect(mockGroq.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'custom-model-v1',
        messages: [{ role: 'user', content: 'Test' }],
        stream: true,
      })
    );
  });

  it('handles AI API errors', async () => {
    mockGroq.chat.completions.create.mockRejectedValue(new Error('Stream failed'));

    const req = createRequest({ prompt: 'Test', mode: 'translation' });

    const res = await aiStream(req, {
      checkQuotaFn: mockCheckQuotaFn,
      groq: mockGroq as unknown as Groq,
    });

    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.error).toBe('AI API error');
    expect(data.details).toContain('Stream failed');
  });

  it('transcribes audio with Whisper before chat completion', async () => {
    mockGroq.audio.transcriptions.create.mockResolvedValue({
      text: 'Bonjour le monde',
      language: 'fr',
    });
    mockGroq.chat.completions.create.mockResolvedValue(
      mockStream('{"type":"expression","value":"Bonjour"}')
    );

    // 4 base64 bytes of arbitrary content
    const audioBase64 = Buffer.from('fake audio bytes').toString('base64');

    const res = await aiStream(
      createRequest({ prompt: 'Translate this', mode: 'translation', audio: audioBase64 }),
      {
        checkQuotaFn: mockCheckQuotaFn,
        groq: mockGroq as unknown as Groq,
      }
    );

    expect(res.status).toBe(200);
    expect(mockGroq.audio.transcriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'whisper-large-v3-turbo' })
    );

    // The user message should contain the transcription
    const chatCallArgs = mockGroq.chat.completions.create.mock.calls[0][0];
    expect(chatCallArgs.messages[0].content).toContain('Bonjour le monde');
    expect(chatCallArgs.messages[0].content).toContain('fr');
  });
});
