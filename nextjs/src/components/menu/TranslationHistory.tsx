"use client"

import { useTranslationHistory } from "@traduxo/packages/hooks/history/useTranslationHistory";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { CircleX } from "lucide-react";

interface TranslationHistoryProps {
  showMenu: boolean
}

function TranslationHistory({ showMenu }: TranslationHistoryProps) {
  const router = useRouter();
  const { status } = useAuth();
  const { translationHistory, isLoading, deleteTranslation } = useTranslationHistory({});
  const { selectTranslation } = useSelectTranslation({ router });

  return (
    <div
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}>
      <div className="flex flex-col gap-6">

        <h1 className="text-2xl text-center font-medium">History</h1>

          <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto max-h-[calc(100dvh-8rem)] pb-8 scrollbar-hide">

            {status === "authenticated" && translationHistory.map((t, idx) => (
              <article
                id={`History-translation-item ${idx + 1}`}
                aria-label={`Select history translation ${idx + 1}`}
                key={idx}
                onClick={() => selectTranslation(t, false)}
                className="
              relative w-full flex flex-col gap-2 md:gap-4 bg-[var(--bg-2)] rounded-md p-2 md:p-4
              border border-transparent hover:border-[var(--input-placeholder)] hover:cursor-pointer
              "
              >
                <button
                  type="button"
                  id={`delete-history-translation-item ${idx + 1}`}
                  aria-label={`Delete history translation ${idx + 1}`}
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent triggering loadTranslation
                    const { success, message } = await deleteTranslation(t.id);
                    if (!success) {
                      toast.error(message);
                      router.push("/");
                    }
                  }}
                  className="absolute right-2 top-0 md:right-3 md:top-1 w-4 text-[var(--input-placeholder)] hover:scale-115 active:scale-90 duration-100"
                >
                  <CircleX className="rounded-full bg-[var(--bg-2)]" />
                </button>
                <div className="flex items-center gap-4 item-center bg-[var(--menu)] rounded-md">
                  <span className="w-10 h-8 border rounded-md flex items-center justify-center">{t.inputLang.toUpperCase()}</span>
                  <p className="h-fit truncate flex-1">{t.inputText}</p>
                </div>
                <div className="flex items-center gap-4 item-center bg-[var(--menu)] rounded-md">
                  <span className="w-10 h-8 border rounded-md flex items-center justify-center">{t.outputLang.toUpperCase()}</span>
                  <p className="h-fit truncate flex-1">{t.translation}</p>
                </div>

              </article>
            ))}

            {/* Display a message if user is not logged in or if favoriteTranslations is empty */}
            {(status !== "authenticated" && !isLoading) ? (
              <p className="text-xl pt-10 text-center fade-in-item">You need to log in to have access to your translation history</p>
            ) : !translationHistory.length && !isLoading ? (
              <p className="text-xl pt-10 text-center fade-in-item">No translations found in history...</p>
            ) : null}
          </div>
      </div>
    </div>
  )
}

export default TranslationHistory
