"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";
import { TranslationItem } from "../../types/translation";

type TranslationSectionProps = {
  translatedText: TranslationItem[];
  inputTextLang: string;
  translatedTextLang: string;
  fading: string[];
  isFavorite: boolean;
  isFavLoading: boolean;
  onFavoriteClick: () => void;
  onSwitchTranslations: (idx: string) => void;
  children?: React.ReactNode; // for explanation / button slot
};

function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function TranslationSection({
  translatedText,
  inputTextLang,
  translatedTextLang,
  fading,
  isFavorite,
  isFavLoading,
  onFavoriteClick,
  onSwitchTranslations,
  children,
}: TranslationSectionProps) {
  const expression = useMemo(() => translatedText.find(item => item.type === "expression")?.value ?? "", [translatedText]);
  const mainTranslation = useMemo(() => translatedText.find(item => item.type === "main_translation")?.value ?? "", [translatedText]);
  const alternatives = useMemo(() => translatedText.filter(item => item.type === "alternative").map(a => a.value), [translatedText]);


  return (
    <div className="w-full max-w-[96%] sm:max-w-xl lg:max-w-3xl flex flex-col mt-12">
      {/* Input language + original text */}
      <article
        className={`flex gap-4 pr-4 bg-[var(--bg-2)] mb-8 rounded-md font-semibold`}
      >
        <p className="flex shrink-0 justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md fade-in-item">
          {inputTextLang.length <= 2 ? inputTextLang.toUpperCase() : ""}
        </p>
        <p className="text-xl min-h-8 flex items-center fade-in-item">{capitalizeFirstLetter(expression)}</p>
      </article>

      {/* Output language + main translation + alt translations */}
      <article
        className={`flex flex-col gap-2 bg-[var(--bg-2)] rounded-md min-h-38`}
      >
        <div className="flex gap-4 pr-4 mb-2 font-semibold relative">
          {/* Favorite button */}
          <button
            onClick={onFavoriteClick}
            disabled={isFavLoading}
            className={`absolute right-4 mt-1 text-[var(--input-placeholder)]
              hover:cursor-pointer hover:text-[var(--text)]
              ${isFavLoading ? "pointer-events-none text-gray-400" : ""}
            `}
          >
            <Star data-testid="star-icon" fill={isFavorite ? "currentColor" : "transparent"} />
          </button>

          {/* Output language */}
          <p className="flex shrink-0 justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md fade-in-item">
            {translatedTextLang.length <= 2 ? translatedTextLang.toUpperCase() : ""}
          </p>

          {/* Main translation */}
          <p
            className={`text-xl max-w-3/4 min-h-8 flex items-center duration-200 fade-in-item ${fading.includes(mainTranslation) ? "scale-y-0" : "scale-y-100"
              }`}
          >
            {capitalizeFirstLetter(mainTranslation)}
          </p>
        </div>

        {/* Alternative translations */}
        <ul className="pl-18 pr-4 pb-4 flex flex-col gap-2">
          {alternatives.map((alt, idx) =>
            <li
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
      </article>
      {/* Children slot (explanation / button) */}
      {children}
    </div>
  );
}

export default TranslationSection;
