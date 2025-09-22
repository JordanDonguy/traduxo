type ReaderLike = {
  read: () => Promise<{ done: boolean; value?: Uint8Array }>;
};

/**
 * Async generator that decodes chunks of text progressively from a ReaderLike.
 * Cross-platform: works in browser/Next.js and React Native (with polyfills).
 */
export async function* decodeTextStream(reader: ReaderLike) {
  let decoder: TextDecoder | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      decoder ??= new TextDecoder(); // create lazily
      yield decoder.decode(value, { stream: true });
    }
  }
}
