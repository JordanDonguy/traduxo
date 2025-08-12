"use client"

import { useEffect, useState } from "react";
import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { CircleX } from "lucide-react";
import { toast } from "react-toastify";

type TranslationHistoryProps = {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

function TranslationHistory({ showMenu, setShowMenu }: TranslationHistoryProps) {
  const { translationHistory, setTranslationHistory, loadTranslationFromHistory } = useTranslationContext();
  const { setInputLang, setOutputLang } = useLanguageContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      setTranslationHistory((prev) => prev.filter((t) => t.id !== id));
    } catch (error: unknown) {
      let message = "An error occurred";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      setShowMenu(false);
    }
  }

  // Fetch user's translation history on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/history");

        if (res.status === 204) {
          // No history — just set empty list
          setTranslationHistory([]);
        } else if (res.ok) {
          const data = await res.json();
          setTranslationHistory(data);
        } else {
          console.error("Failed to fetch history:", res.statusText);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [setTranslationHistory]);

  return (
    <div
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}>
      <div className={`flex flex-col gap-6 ${isLoading ? "opacity-60" : "opacity-100"}`}>

        <h1 className="text-2xl text-center font-bold">History</h1>

        {/* -------------- Loading spinner -------------- */}
        {isLoading ? (
          < div className="flex-1 flex min-h-[70vh] items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (

          <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto max-h-[calc(100dvh-8rem)] pb-8 scrollbar-hide">

            {translationHistory.map((t, idx) => (
              <article
                key={idx}
                onClick={() => {
                  loadTranslationFromHistory(t);
                  setInputLang(t.inputLang);
                  setOutputLang(t.outputLang);
                  setShowMenu(false);
                }}
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
            {!translationHistory.length && !isLoading ? (
              <p className="text-xl pt-10 text-center">No translations found in history...</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default TranslationHistory
