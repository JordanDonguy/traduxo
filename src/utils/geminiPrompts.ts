type TranslationPromptParams = {
  inputText: string;
  inputLang: string; // ISO-639-1 code or "auto"
  outputLang: string;
};

type ExplanationPromptParams = {
  inputTextLang: string;
  translatedTextLang: string;
  translatedText: string[]; // [original, ...translations]
};

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

1. Identify the idiom or expression that needs translating  
2. Translate the following English expression or idiom ${fromLangText}into ${outputLang} in a natural and culturally appropriate way.  
${detectionInstruction}

**Output**  
Return EXACTLY this JSON array (no markdown):  
${outputFormat}

**IMPORTANT:** Always return exactly one translation and 3 alternatives.

Expression: ${inputText}
  `.trim();
};

export function getExplanationPrompt({
  inputTextLang,
  translatedTextLang,
  translatedText,
}: ExplanationPromptParams): string {
  if (translatedText.length < 2) {
    throw new Error("translatedText must include at least the original and one translation.");
  }

  const original = translatedText[0];
  const translations = translatedText.slice(1).join(", ");

  return `
SYSTEM
You are an expert bilingual translator and language teacher.

Your job is to:
1. Explain the meaning, nuance, tone, or grammar of the **original** expression.
2. Provide 2–3 clear usage examples of the translation in natural context.

✳️ VERY IMPORTANT:
- No introduction phrase.
- Reply entirely in ${translatedTextLang}.
- Translate the titles and lists in ${translatedTextLang}.
- Make smart use of bold emphasis.

TEMPLATE
## 💡 Explanation

Write 3–4 very short (~50 words) paragraphs.

## 📘 Examples

- **Example 1:**
    - **Original**:
    - **Translation**:
    - **Explanation**:

✅ Examples must include the source expression. Do not use quotation marks.

USER  
Original (${inputTextLang}): "${original}"

Translation (${translatedTextLang}): "${translations}"
  `.trim();
};

