type TranslationPromptParams = {
  inputText: string;
  inputLang: string;
  outputLang: string;
};

type ExplanationPromptParams = {
  inputTextLang: string;
  translatedTextLang: string;
  translatedText: string[];
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
    ? `4. Detect the ORIGINAL language of the extracted expression (two-letter ISO-639-1 code, lowercase).`
    : "";

  const outputFormat = detectOriginalLang
    ? `["expression", "main translation", "alternative 1", "alternative 2", "alternative 3", "orig-lang-code"]`
    : `["expression", "main translation", "alternative 1", "alternative 2", "alternative 3"]`;

  return `
You will receive a user request that may include extra words such as
"Can you translate ... into ...".  

1. Understand the tone, style, and function of the original expression ${fromLangText} in context (casual? formal? slangy? ironic? emotional? etc.).
2. Suggest a **modern, natural expression** that would be used **in similar situations** by native speakers in ${outputLang}.
3. Do not translate literally. Focus on matching how it feels and how it would be used — even if the words are different.
${detectionInstruction}

**Output**  
Return EXACTLY this JSON array (no markdown):  
${outputFormat}

**IMPORTANT:** Always return exactly one translation and 3 alternatives.

Expression: ${inputText}
  `.trim();
};

// ------------------------------------- Explanation Prompt -------------------------------------
export function getExplanationPrompt({
  inputTextLang,
  translatedTextLang,
  translatedText,
}: ExplanationPromptParams): string {
  if (translatedText.length < 2) {
    throw new Error("translatedText must include at least the original and one translation.");
  }

  const original = translatedText[0];
  const translations = translatedText.slice(1, translatedText.length - 2).join(", ");

  return `
SYSTEM
You are a professional bilingual translator and language teacher.

Your tasks:
1. Explain the meaning, origin, nuance, and tone of the original expression.
2. Provide 2 or 3 clear, natural usage examples for the translation.

Important instructions:
- Do not write any introductory sentences.
- Respond entirely in ${translatedTextLang}.
- Translate all headings and list labels into ${translatedTextLang}.
- For each example, bold **only** the original expression and its translation. Do not bold any other text or entire phrases.

Format:

## 💡 Explanation

Write 3 very short paragraphs with level-3 headings (###) including emojis.

## 📘 Examples

For each example, use this structure:

### 💬 Example 1:
- **Original:** {original}
- **Translation:** {translation}
- **Explanation:** (short explanation)

USER  
Original*** (${inputTextLang}): "${original}"

Translation (${translatedTextLang}): "${translations}"

`.trim();
};

// ------------------------------------- Suggestion Prompt -------------------------------------
export function getSuggestionPrompt({
  detectedLang,
  outputLang,
}: SuggestionPromptParams): string {
  return `
You are a native-speaking language teacher and idiom expert.

Your task:
Suggest one modern, expressive idiom or common phrase that real native speakers use naturally in everyday speech or writing in ${detectedLang}. Then translate it into a **natural, equivalent** expression in ${outputLang}, not a literal translation. If no exact idiom exists, choose the closest equivalent used in similar situations.

**Output**
Return EXACTLY this JSON array (no markdown, no explanation):
["original expression in ${detectedLang}", "best equivalent translation in ${outputLang}", "alternative 1", "alternative 2", "alternative 3"]
  `
};

// ------------------------------------- Pool Prompt -------------------------------------
export function getPoolPrompt(lang: string) {
  return `
Give me 50 diverse and natural idiomatic expressions or phrases in ${lang} that native speakers use in everyday casual conversation. 
Exclude very literal or polite requests like "Could you pass the salt, please?". 
Focus on colorful, idiomatic, or colloquial expressions that convey emotions, reactions, or common situations. 
Output the result as a JSON array of unique strings.
`;
}
