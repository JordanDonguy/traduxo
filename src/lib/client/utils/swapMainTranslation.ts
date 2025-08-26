// Swap the main translation (index 1) with an alternative
export function swapMainTranslation(
  translations: string[],
  altIndex: number
): string[] {
  const updated = [...translations];
  const temp = updated[altIndex];
  updated[altIndex] = updated[1];
  updated[1] = temp;
  return updated;
}
