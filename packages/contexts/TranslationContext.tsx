import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useApp } from "./AppContext";
import { fetchHistory } from "@traduxo/packages/utils/history/fetchHistory";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { Translation, TranslationItem } from "@traduxo/packages/types/translation";

export type TranslationState = {
  inputText: string;
  translatedText: TranslationItem[];
  saveToHistory: boolean;
  inputTextLang: string;
  translatedTextLang: string;
  explanation: string;
  isFavorite: boolean;
  translationId: string | undefined;
  expressionPool: string[];
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedText: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
  setSaveToHistory: React.Dispatch<React.SetStateAction<boolean>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setExplanation: React.Dispatch<React.SetStateAction<string>>;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  setTranslationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  loadTranslationFromMenu: (t: Translation, fromFavorite: boolean) => void;
  translationHistory: Translation[];
  setTranslationHistory: React.Dispatch<React.SetStateAction<Translation[]>>;
  setExpressionPool: React.Dispatch<React.SetStateAction<string[]>>;
};

// We use `TranslationState | undefined` as the type, and set the default value to `undefined`.
// This allows us to throw a helpful error if the context is used outside the provider.
const TranslationContext = createContext<TranslationState | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const { setError } = useApp();
  const { status, token } = useAuth();
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<TranslationItem[]>([]);
  const [saveToHistory, setSaveToHistory] = useState<boolean>(false);

  const [inputTextLang, setInputTextLang] = useState<string>("");
  const [translatedTextLang, setTranslatedTextLang] = useState<string>("");

  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [translationId, setTranslationId] = useState<string | undefined>();;

  const [explanation, setExplanation] = useState<string>("");

  const [translationHistory, setTranslationHistory] = useState<Translation[]>([]);
  const [expressionPool, setExpressionPool] = useState<string[]>([]);

  // Save a translation once saveToHistory is triggered
  useEffect(() => {
    if (status === "authenticated" && saveToHistory) {

      const saveTranslation = async () => {
        try {
          const res = await fetch("/api/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}), // only add if token exists
            },
            body: JSON.stringify({
              translations: translatedText,
              inputLang: inputTextLang,
              outputLang: translatedTextLang,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.error || "Failed to save translation");
          };

          setTranslationHistory(prev => [...prev, data.data])
        } catch (err) {
          console.error(err);
          setError("Network error while saving translation");
        }
      };
      saveTranslation();
      setSaveToHistory(false)
    }
  }, [saveToHistory, setSaveToHistory, inputTextLang, translatedText, translatedTextLang, status, token, setError]);

  // Load a translation from user's history to main display
  function loadTranslationFromMenu(t: Translation, fromFavorite: boolean) {
    setExplanation("");
    if (fromFavorite) {
      setIsFavorite(true);
      setTranslationId(t.id)
    } else {
      setIsFavorite(false);
      setTranslationId(undefined);
    };

    setTranslatedText([
      { type: "expression", value: t.inputText },
      { type: "main_translation", value: t.translation },
      { type: "alternative", value: t.alt1 ?? "" },
      { type: "alternative", value: t.alt2 ?? "" },
      { type: "alternative", value: t.alt3 ?? "" },
    ]);
    setInputTextLang(t.inputLang);
    setTranslatedTextLang(t.outputLang);
  };

  useEffect(() => {
    if (status === "authenticated") {
      const loadHistory = async () => {
        await fetchHistory({
          status,
          token,
          setTranslationHistory
        })
      };
      loadHistory();
    }
  }, [status, token])

  return (
    <TranslationContext.Provider
      value={{
        inputText,
        translatedText,
        saveToHistory,
        inputTextLang,
        translatedTextLang,
        explanation,
        isFavorite,
        translationId,
        expressionPool,
        setInputText,
        setTranslatedText,
        setSaveToHistory,
        setInputTextLang,
        setTranslatedTextLang,
        setExplanation,
        setIsFavorite,
        setTranslationId,
        loadTranslationFromMenu,
        translationHistory,
        setTranslationHistory,
        setExpressionPool,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

// This checks if the context is `undefined` (i.e. used outside a <TranslationProvider>)
// and throws an error to help us catch the mistake early.
export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslationContext must be used inside a TranslationProvider");
  }
  return context;
};
