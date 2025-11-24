"use client";

import ReactMarkdown from "react-markdown";
import LoadingAnimation from "./LoadingAnimation";
import ErrorSection from "./ErrorSection";
import { useExplanation } from "@traduxo/packages/hooks/explanation/useExplanation";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";
import { toast } from "react-toastify";

type ExplanationSectionProps = {
  explanation: string;
  translatedText: TranslationItem[];
};

export default function ExplanationSection({
  explanation,
  translatedText
}: ExplanationSectionProps) {
  const { handleExplanation, isExpLoading, explanationError, setExplanationError } = useExplanation({});

  if (explanationError.length) {
    return <ErrorSection error={explanationError} setError={setExplanationError} />;
  }

  if (explanation.length > 500) {
    return (
      <div 
      className="lg:col-span-2 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-start md:mt-4 mb-8
        fade-in-explanation border-t md:border border-zinc-500 md:rounded-lg pt-4 md:p-4 md:shadow-md min-h-[60vh]"
      >
        <div className="fade-in-item explanation">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (isExpLoading) {
    return (
      <div className="lg:col-span-2 flex justify-center items-center w-full h-[58px] md:mt-4">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div
      className={`lg:col-span-2 flex justify-center items-center flex-1 w-full self-center ease-in-out transform md:mt-4`}
    >
      <button
        id="explanation-button"
        data-testid="explanation-button"
        aria-label="Get AI explanations"
        onClick={() => {
          if (translatedText.length === 0) {
            return toast.warn("Hmm… I need a translation before I can explain it 🤔")
          }
          blurActiveInput();
          handleExplanation();
        }}
        className="w-full max-w-xl py-4 rounded-full border-2 border-[var(--border)] text-xl hover:cursor-pointer hover:bg-[var(--hover)] active:scale-90 duration-100"
      >
        ✨ AI explanations
      </button>
    </div>
  );
}
