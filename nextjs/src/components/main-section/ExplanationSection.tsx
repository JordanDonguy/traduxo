"use client";

import ReactMarkdown from "react-markdown";
import LoadingAnimation from "./LoadingAnimation";
import ErrorSection from "./ErrorSection";
import { useExplanation } from "@traduxo/packages/hooks/explanation/useExplanation";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";
import { toast } from "react-toastify";
import CopyButton from "./CopyButton";

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
        className="lg:col-span-2 md:shadow-md md:border border-[var(--gray-1)] md:bg-[var(--bg-3)] rounded-3xl w-full max-w-5xl mx-auto flex-1 flex flex-col justify-start md:mt-4 lg:mt-6 mb-8 md:mb-12
        fade-in-explanation p-1 md:p-6 min-h-[60vh]"
      >
        <div className="fade-in-item explanation">
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>

        <CopyButton text={explanation} className="border mb-2 ml-2 md:mx-6 w-20 shadow-md" />
      </div>
    );
  }

  if (isExpLoading) {
    return (
      <div className="lg:col-span-2 fade-in-item flex justify-center items-center w-full h-[58px] md:mt-4">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div
      className={`lg:col-span-2 flex justify-center items-center flex-1 w-full self-center ease-in-out transform md:mt-4 lg:mt-10`}
    >
      <button
        id="explanation-button"
        data-testid="explanation-button"
        aria-label="Get AI explanations"
        onClick={() => {
          if (translatedText.length === 0) {
            return toast.info("Hmm… I need a translation before I can explain it 🤔")
          }
          blurActiveInput();
          handleExplanation();
        }}
        className="w-full max-w-xl py-4 text-[var(--blue-1)] shadow-md border-y border-[var(--gray-2)]/20 bg-[var(--bg-2)]/50 hover-1 rounded-full text-xl active:scale-90 duration-100"
      >
        ✨ AI explanations
      </button>
    </div>
  );
}
