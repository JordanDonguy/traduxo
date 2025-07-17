export function quoteToBold(chunk: string) {
  let out = "";
  for (const ch of chunk) {
    if (ch === '"' || ch === '“' || ch === '”') {
      out += '**';            // emit ** instead of the quote mark
    } else {
      out += ch;
    }
  }
  return out;
}
