"use client"

import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useFavoriteTranslations } from "@traduxo/packages/hooks/favorites/useFavoriteTranslations";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";
import { CircleX } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface FavoriteTranslationProps {
  showMenu: boolean
};

function FavoriteTranslation({ showMenu }: FavoriteTranslationProps) {
  const { setError } = useApp();
  const router = useRouter();
  const { favoriteTranslations, isLoading, status, deleteTranslation } = useFavoriteTranslations({});
  const { selectTranslation } = useSelectTranslation({ router, setError });

  return (
    <div
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}>
      <div className="flex flex-col gap-6">

        <h1 className="text-2xl text-center font-medium">Favorites</h1>

        <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto max-h-[calc(100dvh-8rem)] pb-8 scrollbar-hide">

          {favoriteTranslations.map((t, idx) => (
            <article
              id={`favorite-translation-item ${idx + 1}`}
              aria-label={`Select favorite translation ${idx + 1}`}
              key={idx}
              onClick={() => selectTranslation(t, true)}
              className="
              relative w-full flex flex-col gap-2 md:gap-4 bg-[var(--bg-2)] rounded-md p-2 md:p-4 fade-in-item
              border border-transparent hover:border-[var(--input-placeholder)] hover:cursor-pointer
              "
            >
              <button
                type="button"
                id={`delete-favorite-translation-item ${idx + 1}`}
                aria-label={`Delete favorite translation ${idx + 1}`}
                onClick={async (e) => {
                  e.stopPropagation(); // Prevent triggering loadTranslation
                  const res = await deleteTranslation(t.id);
                  if (!res.success) {
                    router.push("/");
                    toast.error(res.message);
                  };
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
            <p className="text-xl pt-10 text-center fade-in-item origin-left">You need to log in to have access to your favorite translations</p>
          ) : (!favoriteTranslations.length && !isLoading) ? (
            <p className="text-xl pt-10 text-center fade-in-item">No favorite translations found...</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default FavoriteTranslation
