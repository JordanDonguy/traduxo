"use client";

import { useState, useRef, useEffect } from "react";
import { Copy } from "lucide-react";
import { toast } from "react-toastify";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: number;
}

const CopyButton = ({
  text,
  className = "",
  size = 24,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    if (!text) return toast.info("No text to copy… 👀");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
        timeoutRef.current = null;
      }, 2000);
    });
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className={`w-10 h-10 text-[var(--input-placeholder)] hover:bg-[var(--hover)] hover:text-[var(--text)] hover:cursor-pointer rounded-full flex justify-center items-center ${className}`}
        aria-label="Copy text"
        type="button"
      >
        <Copy className={copied ? "text-green-400" : ""} size={size} />
      </button>

      {copied && (
        <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-zinc-700 text-white text-xs px-2 py-1 rounded-md shadow-md">
          Copied!
        </span>
      )}
    </div>
  );
};

export default CopyButton;
