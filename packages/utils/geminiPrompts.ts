/* istanbul ignore file */

import { TranslationItem } from "@traduxo/packages/types/translation";

type TranslationPromptParams = {
  inputText: string;
  inputLang: string;
  outputLang: string;
};

type ExplanationPromptParams = {
  inputTextLang: string;
  translatedTextLang: string;
  translatedText: TranslationItem[];
  systemLang: string;
};

type SuggestionPromptParams = {
  detectedLang: string
  outputLang: string;
};

// ------------------------------------- Translation Prompt -------------------------------------
export function getTranslationPrompt({
  inputText,
  inputLang,
  outputLang
}: TranslationPromptParams): string {
  const detectOriginalLang = inputLang === "auto";
  const fromLangText = detectOriginalLang ? "" : `(in ${inputLang}) `;

  const detectionInstruction = detectOriginalLang
    ? `4. Detect the ORIGINAL language of the extracted expression and return it as a separate JSON object (two-letter ISO-639-1 code, lowercase).`
    : "";

  return `
You will receive a user request that may include extra words such as
"Can you translate ... into ...".  

1. Understand the tone, style, and function of the original expression ${fromLangText} in context (casual? formal? slangy? ironic? emotional? etc.).
2. Suggest a **modern, natural expression** that would be used **in similar situations** by native speakers in ${outputLang}.
3. Do not translate literally. Focus on matching how it feels and how it would be used — even if the words are different.
${detectionInstruction}

**Output**  
Return MULTIPLE JSON objects, one per line, **no markdown**, with the following structure:

- {"type":"expression","value":"..."}   // The original expression
- {"type":"main_translation","value":"..."}
- {"type":"alternative","value":"..."}
- {"type":"alternative","value":"..."}
- {"type":"alternative","value":"..."}
${detectOriginalLang ? '- {"type":"orig_lang_code","value":"..."}' : ''}

Always return exactly one main translation and exactly 3 alternatives.

Expression: ${inputText}
  `;
}

// ------------------------------------- Explanation Prompt -------------------------------------
export function getExplanationPrompt({
  inputTextLang,
  translatedTextLang,
  translatedText,
  systemLang,
}: ExplanationPromptParams): string {
  // Find the main items by type
  const originalItem = translatedText.find(t => t.type === "expression");
  const mainTranslationItem = translatedText.find(t => t.type === "main_translation");
  const alternativeItems = translatedText.filter(t => t.type === "alternative");

  if (!originalItem || !mainTranslationItem) {
    throw new Error("translatedText must include at least 'expression' and 'main_translation'.");
  }

  const original = originalItem.value;
  const mainTranslation = mainTranslationItem.value;
  const alternatives = alternativeItems.map(a => a.value).join(", ");

  return `
SYSTEM
You are a professional bilingual translator and language teacher.

Your tasks:
1. Explain the meaning, origin, nuance, and tone of the original expression.
2. Provide 2 or 3 clear, natural usage example phrases for the translation.

Important instructions:
- Do not write any introductory sentences.
- Respond entirely in ${systemLang}.
- Translate all headings into ${systemLang}.
- For each example, bold **only** the original expression and its translation. Do not bold any other text or entire phrases.

Format:

## 💡 Explanation

Write 3 very short paragraphs with level-3 headings (###) including emojis.

## 📘 Examples

For each example, use this structure:

### 💬 Example 1:
- **${inputTextLang.toUpperCase()}:** Full sentence in ${inputTextLang} containing **${original}**
- **${translatedTextLang.toUpperCase()}:** Full sentence in ${translatedTextLang} containing **${mainTranslation}**
- Short explanation in ${systemLang}

USER  
Original*** (${inputTextLang}): "${original}"

Translation (${translatedTextLang}): "${mainTranslation}${alternatives ? `, ${alternatives}` : ""}"

`.trim();
}

// ------------------------------------- Suggestion Prompt -------------------------------------
export function getSuggestionPrompt({
  detectedLang,
  outputLang,
}: SuggestionPromptParams): string {
  const promptVariants = [
    `Suggest one modern, expressive idiom or common phrase that real native speakers use naturally in everyday speech or writing in ${detectedLang}. Avoid overused internet clichés.`,
    `Suggest one fresh, less common idiom or everyday expression in ${detectedLang} that native speakers actually use in daily life. Avoid clichés or overused expressions.`,
    `Suggest one contemporary idiom or phrase in ${detectedLang} that is actively used by younger or modern speakers today. Avoid overused internet clichés.`,
    `Suggest one idiom or phrase in ${detectedLang} that differs from typical textbook examples. Choose something diverse or regionally popular but still understandable to most native speakers.`,
    `Suggest one culturally natural idiom or phrase in ${detectedLang} that feels authentic and commonly used in casual conversations, not a literal or formal one.`,
    `Suggest one idiom or phrase in ${detectedLang} that is interesting and adds variety. Prioritize novelty and ensure it would sound natural to a native speaker.`
  ];

  const randomVariant = promptVariants[Math.floor(Math.random() * promptVariants.length)];

  return `
You are a native-speaking language teacher and idiom expert.

Your task:
${randomVariant}
${detectedLang === "fr" ? "IMPORTANT: Avoid 'Avoir le cafard'." : ""}
Then translate it into a **natural, equivalent** expression in ${outputLang}, not a literal translation. 
If no exact idiom exists, choose the closest equivalent used in similar situations.

**Output**
Return EXACTLY multiple JSON objects, one per line (no markdown), with this format:

{"type":"expression","value":"original expression in ${detectedLang}"}
{"type":"main_translation","value":"best equivalent translation in ${outputLang}"}
{"type":"alternative","value":"..."}
{"type":"alternative","value":"..."}
{"type":"alternative","value":"..."}

**IMPORTANT:** Each object must be on its own line. Do not wrap them in an array.
`;
}


// ------------------------------------- Pool Prompt -------------------------------------
export function getPoolPrompt(lang: string) {
  return `
Give me 50 diverse, natural, idiomatic expressions in ${lang} that native speakers use in casual conversation. 
They must be figurative, colorful, or slang - based — avoid any greetings, farewells, or small - talk phrases
    (e.g., “What’s up ?”, “How’s it going ?”). 
Do not include overly polite or literal requests like “Could you pass the salt, please ?”. 
Ensure at least 50 % use metaphors or imagery. 
Vary across regions where ${lang} is spoken. 
Output only as a JSON array of unique strings, no explanations.
`;
}
