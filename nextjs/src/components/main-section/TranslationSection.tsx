"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { TranslationItem } from "@traduxo/packages/types/translation";
import LoadingAnimation from "./LoadingAnimation";

type TranslationSectionProps = {
  translatedText: TranslationItem[];
  fading: string[];
  isFavorite: boolean;
  isFavLoading: boolean;
  onFavoriteClick: () => void;
  onSwitchTranslations: (idx: string) => void;
  isLoading: boolean;
};

function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function TranslationSection({
  translatedText,
  fading,
  isFavorite,
  isFavLoading,
  onFavoriteClick,
  onSwitchTranslations,
  isLoading
}: TranslationSectionProps) {
  const mainTranslation = useMemo(() => translatedText.find(item => item.type === "main_translation")?.value ?? "", [translatedText]);
  const alternatives = useMemo(() => translatedText.filter(item => item.type === "alternative").map(a => a.value), [translatedText]);

  return (
    <article
      className={`w-full h-full col-span-1 flex flex-col gap-2 bg-[var(--bg-2)] rounded-md min-h-42`}
    >
      {isLoading ? (
        <div className="flex justify-start pl-12">
          <LoadingAnimation />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row-reverse justify-between gap-4 px-4 pt-4 md:pl-6 mb-2 font-semibold relative">

            {/* Favorite button */}
            <button
              id="favorite-button"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={onFavoriteClick}
              disabled={isFavLoading}
              className={`self-end md:self-start md:pr-4 lg:pr-0 md:mt-1 text-[var(--input-placeholder)]
              hover:cursor-pointer hover:text-[var(--text)]
              ${isFavLoading ? "pointer-events-none text-gray-400" : ""}
            `}
            >
              <Star data-testid="star-icon" fill={isFavorite ? "currentColor" : "transparent"} />
            </button>

            {/* Main translation */}
            <p
              className={`text-2xl min-h-8 flex items-center duration-200 fade-in-item 
              ${fading.includes(mainTranslation) ? "scale-y-0" : "scale-y-100"}
              ${!mainTranslation && "text-[var(--input-placeholder)]"}
              `}
            >
              {mainTranslation ? capitalizeFirstLetter(mainTranslation) : "Translation"}
            </p>
          </div>

          {/* Alternative translations */}
          <ul className="pl-18 pr-4 pb-4 flex flex-col gap-2">
            {alternatives.map((alt, idx) =>
              <li
                id={`alternative-translation ${idx + 1}`}
                aria-label={`Alternative translation ${idx + 1}`}
                key={idx}
                onClick={() => onSwitchTranslations(alt)}
                className={`list-disc w-fit  transition-transform duration-200 fade-in-item
                ${fading.includes(alt) ? "scale-y-0" : "scale-y-100"}
                hover:text-zinc-400 hover:cursor-pointer`}
              >
                {capitalizeFirstLetter(alt)}
              </li>
            )}
          </ul>
        </>
      )}
    </article>
  );
}

export default TranslationSection;
