"use client"

import { useEffect, useState } from "react";
import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import { CircleX } from "lucide-react";
import { toast } from "react-toastify";

type FavoriteTranslationProps = {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

type FavoriteTranslation = {
  id: string;
  inputText: string;
  translation: string;
  inputLang: string;
  outputLang: string;
  alt1: string | null;
  alt2: string | null;
  alt3: string | null;
};

function FavoriteTranslation({ showMenu, setShowMenu }: FavoriteTranslationProps) {
  const { loadTranslationFromMenu, translationId, setTranslationId, setIsFavorite } = useTranslationContext();
  const [favoriteTranslations, setFavoriteTranslations] = useState<FavoriteTranslation[]>([]);
  const { setInputLang, setOutputLang } = useLanguageContext();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { status } = useSession();

  async function deleteTranslation(id: string) {
    // If the deleted translation is currently shown in the main view,
    // reset its favorite state in the UI.
    if (translationId === id) {
      setTranslationId(undefined);
      setIsFavorite(false)
    }

    try {
      const res = await fetch("/api/favorite", {
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
      setFavoriteTranslations((prev) => prev.filter((t) => t.id !== id));
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
    if (status === "loading") return;
    if (status !== "authenticated") return setIsLoading(false);

    async function fetchData() {
      try {
        const res = await fetch("/api/favorite");

        if (res.status === 204) {
          // No history — just set empty list
          setFavoriteTranslations([]);
        } else if (res.ok) {
          const data = await res.json();
          setFavoriteTranslations(data);
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
  }, [setFavoriteTranslations, status]);

  return (
    <div
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}>
      <div className="flex flex-col gap-6">

        <h1 className="text-2xl text-center font-medium">Favorites</h1>

        {/* -------------- Loading spinner -------------- */}
        {isLoading ? (
          < div className="flex-1 flex min-h-[70vh] items-center justify-center">
            <div className="spinner" />
          </div>
        ) : (

          <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto max-h-[calc(100dvh-8rem)] pb-8 scrollbar-hide">

            {favoriteTranslations.map((t, idx) => (
              <article
                key={idx}
                onClick={() => {
                  loadTranslationFromMenu(t, true);
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

            {/* Display a message if user is not logged in or if favoriteTranslations is empty */}
            {(status !== "authenticated" && !isLoading) ? (
              <p className="text-xl pt-10 text-center">You need to log in to have access to your favorite translations</p>
            ) : (!favoriteTranslations.length && !isLoading) ? (
              <p className="text-xl pt-10 text-center">No favorite translations found...</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoriteTranslation
