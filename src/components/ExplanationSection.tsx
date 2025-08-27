"use client";

import ReactMarkdown from "react-markdown";
import LoadingAnimation from "./LoadingAnimation";
import ErrorSection from "./ErrorSection";
import { useExplanation } from "@/lib/client/hooks/useExplanation";

type ExplanationSectionProps = {
  explanation: string;
  mounted: boolean;
  ready: boolean;
};

export default function ExplanationSection({
  explanation,
  mounted,
  ready,
}: ExplanationSectionProps) {
  const { handleExplanation, isExpLoading, explanationError, setExplanationError } = useExplanation();

  if (explanationError.length) {
    return <ErrorSection error={explanationError} setError={setExplanationError} />;
  }

  if (explanation.length) {
    return (
      <div className="flex-1 flex flex-col justify-center explanation mt-10 mb-4">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    );
  }

  if (isExpLoading) {
    return (
      <div className="flex justify-center items-center w-full h-[58px] mt-8">
        <LoadingAnimation />
      </div>
    );
  }

  return (
    <div
      className={`flex justify-center items-center flex-1 w-full self-center duration-500 ease-in-out transform mt-8
        ${
          mounted
            ? ready
              ? "scale-x-100 opacity-100"
              : "delay-1000 scale-x-100 opacity-100"
            : "scale-x-0 opacity-0"
        }`}
    >
      <button
        onClick={handleExplanation}
        className="w-full max-w-xl py-4 rounded-full border border-[var(--border)] bg-[var(--btn)] hover:cursor-pointer hover:bg-[var(--hover)] active:scale-90 duration-100"
      >
        ✨ AI explanations
      </button>
    </div>
  );
}
