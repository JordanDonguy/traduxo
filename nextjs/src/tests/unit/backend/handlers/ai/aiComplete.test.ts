import type Groq from 'groq-sdk';
import { aiComplete } from "@/lib/server/handlers/ai/aiComplete";

const mockGroq = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

const makeRequest = (body: unknown) =>
  new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('aiComplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if prompt is missing', async () => {
    const req = makeRequest({});

    const res = await aiComplete(req, {
      groq: mockGroq as unknown as Groq,
    });

    expect(res.status).toBe(400);
  });

  it('calls Groq API with json_object response_format and returns text on success', async () => {
    mockGroq.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '{"expressions":["foo","bar"]}' } }],
    });

    const req = makeRequest({ prompt: 'translate this' });

    const res = await aiComplete(req, {
      groq: mockGroq as unknown as Groq,
    });

    expect(mockGroq.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: expect.any(String),
        messages: [{ role: 'user', content: 'translate this' }],
        response_format: { type: 'json_object' },
      })
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe('{"expressions":["foo","bar"]}');
  });

  it('handles AI API errors', async () => {
    mockGroq.chat.completions.create.mockRejectedValue(new Error('API failed'));

    const req = makeRequest({ prompt: 'something' });

    const res = await aiComplete(req, {
      groq: mockGroq as unknown as Groq,
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('AI API error');
    expect(data.details).toContain('API failed');
  });
});
