"use client";

import ReactMarkdown from "react-markdown";
import LoadingAnimation from "./LoadingAnimation";

type ExplanationSectionProps = {
  explanation: string;
  error: string;
  isLoading: boolean;
  mounted: boolean;
  ready: boolean;
  onGenerate: () => void;
};

export default function ExplanationSection({
  explanation,
  error,
  isLoading,
  mounted,
  ready,
  onGenerate,
}: ExplanationSectionProps) {
  if (error.length) {
    return <p className="text-2xl/10 text-center whitespace-pre-line mt-8">{error}</p>;
  }

  if (explanation.length) {
    return (
      <div className="flex-1 flex flex-col justify-center explanation mt-12 mb-4">
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    );
  }

  if (isLoading) {
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
        onClick={onGenerate}
        className="w-full max-w-xl py-4 rounded-full border border-[var(--border)] bg-[var(--btn)] hover:cursor-pointer hover:bg-[var(--hover)] active:scale-90 duration-100"
      >
        ✨ AI explanations
      </button>
    </div>
  );
}
