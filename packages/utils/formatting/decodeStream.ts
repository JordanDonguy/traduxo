type ReaderLike = {
  read: () => Promise<{ done: boolean; value?: Uint8Array }>;
};

export async function* decodeStream(reader: ReaderLike) {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      buffer += decoder.decode(value, { stream: true });
      // Split by newline
      const parts = buffer.split("\n");
      buffer = parts.pop() || ""; // keep last incomplete chunk

      for (const part of parts) {
        if (!part.trim()) continue;
        yield part;
      }
    }
  }

  // Yield any remaining chunk
  if (buffer.trim()) yield buffer;
}

