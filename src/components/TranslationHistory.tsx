"use client"

import { useEffect, useState } from "react";
import { useTranslationContext } from "@/context/TranslationContext";
import { CircleX } from "lucide-react";
import { toast } from "react-toastify";

type TranslationHistoryProps = {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

type Translation = {
  id: string;
  inputText: string;
  translation: string;
  inputLang: string;
  outputLang: string;
  alt1: string | null;
  alt2: string | null;
  alt3: string | null;
};

function TranslationHistory({ showMenu, setShowMenu }: TranslationHistoryProps) {
  const { setTranslatedText, setInputTextLang, setTranslatedTextLang, setExplanation, setLoadingFromHistory } = useTranslationContext();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [translations, setTranslations] = useState<Translation[]>([]);

  function loadTranslation(t: Translation) {
    setLoadingFromHistory(true)
    setExplanation("");
    setTranslatedText([t.inputText, t.translation, t.alt1 ?? "", t.alt2 ?? "", t.alt3 ?? ""]);
    setInputTextLang(t.inputLang);
    setTranslatedTextLang(t.outputLang);
    setShowMenu(false);
  };

  async function deleteTranslation(id: string) {
    try {
      const res = await fetch("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error || "Failed to delete translation";
        throw new Error(errorMsg);
      }

      // Remove the deleted translation from the state
      setTranslations((prev) => prev.filter((t) => t.id !== id));
    } catch (error: unknown) {
      let message = "An error occurred";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      setShowMenu(false);
    }
  }

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const res = await fetch("/api/history");
      const data = await res.json();
      setTranslations(data);
      setIsLoading(false)
    }
    fetchData();
  }, [])

  return (
    <div
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}>
      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        < div className="fixed inset-0 bg-(var[--menu]) bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : null}

      <div className={`flex flex-col gap-6 ${isLoading ? "opacity-60" : "opacity-100"}`}>

        <h1 className="text-2xl text-center font-bold">History</h1>
        <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto max-h-[calc(100vh-8rem)] pb-8 scrollbar-hide">
          {translations.map((t, idx) => (
            <article
              key={idx}
              onClick={() => loadTranslation(t)}
              className="
              relative w-full flex flex-col gap-2 md:gap-4 bg-[var(--bg-2)] rounded-md p-2 md:p-4
              border border-transparent hover:border-[var(--input-placeholder)] hover:cursor-pointer
              "
            >
              <div
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering loadTranslation
                  deleteTranslation(t.id);
                }}
                className="absolute right-2 top-0 md:right-3 md:top-1 w-4 text-[var(--input-placeholder)] hover:scale-115 active:scale-90 duration-100"
              >
                <CircleX className="rounded-full bg-[var(--bg-2)]" />
              </div>
              <div className="flex items-center gap-4 item-center bg-[var(--menu)] rounded-md">
                <span className="w-10 h-8 border rounded-md flex items-center justify-center">{t.inputLang?.toUpperCase()}</span>
                <p className="h-fit truncate flex-1">{t.inputText}</p>
              </div>
              <div className="flex items-center gap-4 item-center bg-[var(--menu)] rounded-md">
                <span className="w-10 h-8 border rounded-md flex items-center justify-center">{t.outputLang?.toUpperCase()}</span>
                <p className="h-fit truncate flex-1">{t.translation}</p>
              </div>

            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TranslationHistory
