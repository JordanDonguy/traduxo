"use client";

import { Star } from "lucide-react";

type TranslationSectionProps = {
  translatedText: string[];
  inputTextLang: string;
  translatedTextLang: string;
  fading: number[];
  mounted: boolean;
  ready: boolean;
  isFavorite: boolean;
  isFavLoading: boolean;
  onFavoriteClick: () => void;
  onSwitchTranslations: (idx: number) => void;
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
  mounted,
  ready,
  isFavorite,
  isFavLoading,
  onFavoriteClick,
  onSwitchTranslations,
  children,
}: TranslationSectionProps) {
  return (
    <div
      className="w-full max-w-[96%] sm:max-w-xl lg:max-w-3xl flex flex-col mt-12"
    >
      {/* Input language + original text */}
      <article
        className={`flex gap-4 pr-4 bg-[var(--bg-2)] mb-8 rounded-md duration-500 ease-in-out transform font-semibold ${mounted ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
          }`}
      >
        <p className="flex shrink-0 justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md">
          {inputTextLang.length <= 2 ? inputTextLang?.toUpperCase() : ""}
        </p>
        <p className="text-xl min-h-8 flex items-center">
          {capitalizeFirstLetter(translatedText[0])}
        </p>
      </article>

      {/* Output language + main translation + alt translations */}
      <article
        className={`flex flex-col gap-2 bg-[var(--bg-2)] rounded-md duration-500 ease-in-out transform
          ${mounted
            ? ready
              ? "translate-x-0 opacity-100"
              : "delay-500 translate-x-0 opacity-100"
            : "-translate-x-full opacity-0"
          }`}
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
            <Star fill={isFavorite ? "currentColor" : "transparent"} />
          </button>

          {/* Output language */}
          <p className="flex shrink-0 justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md">
            {translatedTextLang.length <= 2 ? translatedTextLang?.toUpperCase() : ""}
          </p>

          {/* Main translation */}
          <p
            className={`text-xl max-w-3/4 min-h-8 flex items-center duration-200 ${fading.includes(1) ? "opacity-0" : "opacity-100"
              }`}
          >
            {capitalizeFirstLetter(translatedText[1])}
          </p>
        </div>

        {/* Alternative translations */}
        <ul className="pl-18 pr-4 pb-4 flex flex-col gap-2">
          {translatedText.slice(2).map((alt, idx) =>
            alt.length > 2 ? (
              <li
                key={idx}
                onClick={() => onSwitchTranslations(idx)}
                className={`list-disc w-fit duration-200 ${fading.includes(idx + 2) ? "opacity-0" : "opacity-100"
                  } hover:text-zinc-400 hover:cursor-pointer`}
              >
                {capitalizeFirstLetter(alt)}
              </li>
            ) : null
          )}
        </ul>
      </article>

      {/* Children slot (explanation / button) */}
      {children}
    </div>
  );
}

export default TranslationSection;
