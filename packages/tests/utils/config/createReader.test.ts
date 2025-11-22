import { createReader } from "@traduxo/packages/utils/config/createReader";

describe("createReader", () => {
  it("returns a reader that reads the text from a Response", async () => {
    const mockText = "Hello, world!";
    const mockResponse = {
      text: jest.fn().mockResolvedValue(mockText),
    } as unknown as Response;

    const reader = await createReader(mockResponse);

    // First read should return the encoded text
    const first = await reader.read();
    expect(first.done).toBe(false);
    expect(first.value).toEqual(new TextEncoder().encode(mockText));

    // Second read should indicate done
    const second = await reader.read();
    expect(second.done).toBe(true);
    expect(second.value).toBeUndefined();

    // Ensure text() was called exactly once
    expect(mockResponse.text).toHaveBeenCalledTimes(1);
  });

  it("returns done immediately if read is called twice", async () => {
    const mockResponse = {
      text: jest.fn().mockResolvedValue("Test"),
    } as unknown as Response;

    const reader = await createReader(mockResponse);

    // First read
    await reader.read();

    // Second read
    const second = await reader.read();
    expect(second).toEqual({ done: true, value: undefined });
  });
});
