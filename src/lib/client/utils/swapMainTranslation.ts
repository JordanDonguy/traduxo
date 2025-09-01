import { TranslationItem } from "../../../../types/translation";

// Swap the main translation with an alternative
export function swapMainTranslation(
  translations: TranslationItem[],
  mainTranslation: string,
  alt: string
) {
  const updated = [...translations];

  // find the indices by value
  const mainIdx = updated.findIndex(
    t => t.type === "main_translation" && t.value === mainTranslation
  );
  const altIdx = updated.findIndex(
    t => t.type === "alternative" && t.value === alt
  );

  if (mainIdx === -1 || altIdx === -1) return updated;

  // swap their types
  [updated[mainIdx].type, updated[altIdx].type] = [
    updated[altIdx].type,
    updated[mainIdx].type,
  ];

  return updated;
}
