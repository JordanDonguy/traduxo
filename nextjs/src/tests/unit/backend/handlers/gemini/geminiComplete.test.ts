import { geminiComplete } from "@/lib/server/handlers/gemini/geminiComplete";
import { GoogleGenAI } from '@google/genai';


type GenerateContentFn = typeof GoogleGenAI.prototype.models.generateContent;

// ------ Mock config ------
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

// ------ Tests ------
describe('geminiComplete', () => {
  // ------ Test 1️⃣ ------
  it('returns 400 if prompt is missing', async () => {
    const req = makeRequest({});

    const res = await geminiComplete(req, {
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
    });

    expect(res.status).toBe(400);
  });

  // ------ Test 2️⃣ ------
  it('calls Gemini API and returns text on success', async () => {
    mockGenai.models.generateContent.mockResolvedValue(
      { text: 'fake-response' } as Awaited<ReturnType<GenerateContentFn>>
    );

    const req = makeRequest({ prompt: 'translate this' });

    const res = await geminiComplete(req, {
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
    });

    expect(mockGenai.models.generateContent).toHaveBeenCalledWith({
      model: expect.any(String),
      contents: 'translate this',
      config: expect.any(Object),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.text).toBe('fake-response');
  });

  // ------ Test 3️⃣ ------
  it('handles Gemini API errors', async () => {
    mockGenai.models.generateContent.mockRejectedValue(new Error('API failed'));

    const req = makeRequest({ prompt: 'something' });

    const res = await geminiComplete(req, {
      genai: mockGenai as unknown as InstanceType<typeof GoogleGenAI>,
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Gemini API error');
    expect(data.details).toContain('API failed');
  });
});
