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
  alreadySuggested: string[];
};

// ------------------------------------- Translation Prompt -------------------------------------
export function getTranslationPrompt({
  inputText,
  inputLang,
  outputLang,
}: TranslationPromptParams): string {
  const detectOriginalLang = inputLang === "auto";
  const fromLangText = detectOriginalLang ? "" : `from ${inputLang} `;

  const detectionInstruction = detectOriginalLang
    ? `3. Detect the ORIGINAL language of the extracted expression (two-letter ISO-639-1 code, lowercase).`
    : "";

  const outputFormat = detectOriginalLang
    ? `["expression", "main translation", "alternative 1", "alternative 2", "alternative 3", "orig-lang-code"]`
    : `["expression", "main translation", "alternative 1", "alternative 2", "alternative 3"]`;

  return `
You will receive a user request that may include extra words such as
"Can you translate ... into ...".  

1. Identify the idiom or expression that needs translating.
2. Translate the following expression ${fromLangText}into ${outputLang} in a natural and idomatic way.
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
- Use exactly two level-2 headings (##) as specified below.
- For each example, bold **only** the original expression and its translation. Do not bold any other text or entire phrases.

Format:

## 💡 Explanation

Write 3 to 4 very short paragraphs with level-3 headings (###) including emojis.

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
  alreadySuggested
}: SuggestionPromptParams): string {
  return `
You are a native-speaking language teacher and idiom expert.

Your task:
Suggest one modern, expressive idiom or common phrase that real native speakers use naturally in everyday speech or writing in ${outputLang}. Then translate it into a **natural, equivalent** expression in ${detectedLang}, not a literal translation. If no exact idiom exists, choose the closest equivalent used in similar situations.

Guidelines:
- Avoid tired clichés like "break the ice" or "raining cats and dogs".
- Focus on up-to-date, authentic, regionally relevant expressions.
- Do not invent new expressions.
- Translations must preserve the original expression’s meaning, connotation, and emotional impact.

**Output**
Return EXACTLY this JSON array (no markdown, no explanation):

["original expression in ${outputLang}", "best equivalent translation in ${detectedLang}", "alternative 1", "alternative 2", "alternative 3"]

**IMPORTANT:**
- Return only one expression and exactly three alternatives.
- All four entries must be natural and idiomatic in ${detectedLang}, and must reflect the same meaning and tone as the original expression.
${alreadySuggested.length ? `- Do not include any of these previously suggested expressions: ${alreadySuggested.join(", ")}.` : ""}

  `
};
