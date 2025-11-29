"use client";

import { useRouter } from "next/navigation";
import { Dices } from "lucide-react";

interface DicesButtonProps {
  suggestTranslation: () => void;
  isRolling?: boolean;
  size?: number;
  className?: string;
  text?: string;
}

const DicesButton = ({
  suggestTranslation,
  isRolling = false,
  size = 24,
  className = "",
  text= ""
}: DicesButtonProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push("/");
    suggestTranslation();
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        handleClick()
      }}
      className={`flex p-2 text-[var(--gray-6)] rounded-full hover-1 ${className} ${text && "md:border border-[var(--gray-1)] md:bg-[var(--bg-2)]/60 py-0 px-4 items-center md:shadow-sm"}`}
      aria-label="Suggest an expression"
    >
      <Dices size={size} className={isRolling ? "animate-dice-roll" : ""} />
      <div className={`${text && "px-2"} hidden md:inline`}>{text}</div>
    </button>
  );
};

export default DicesButton;
