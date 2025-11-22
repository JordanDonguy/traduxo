export type Translation = {
  id: string;
  inputText: string;
  translation: string;
  inputLang: string;
  outputLang: string;
  alt1: string | null;
  alt2: string | null;
  alt3: string | null;
};

export type TranslationItem = {
  type: "expression" | "main_translation" | "alternative" | "orig_lang_code" | "error";
  value: string;
};
