import { Buffer } from "buffer";

type ReaderLike = {
  read: () => Promise<{ done: boolean; value?: Uint8Array }>;
};

export async function* decodeStream(reader: ReaderLike) {
  let buffer = Buffer.from([]);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      buffer = Buffer.concat([buffer, Buffer.from(value)]);
      // Split by newline
      const parts = buffer.toString("utf-8").split("\n");
      buffer = Buffer.from(parts.pop() || ""); // keep last incomplete chunk

      for (const part of parts) {
        if (!part.trim()) continue;
        yield part;
      }
    }
  }

  // Yield any remaining chunk
  const remaining = buffer.toString("utf-8");
  if (remaining.trim()) yield remaining;
}
