"use client";

import { useRouter } from "next/navigation";
import { Dices } from "lucide-react";

interface DicesButtonProps {
  suggestTranslation: () => void;
  isRolling?: boolean;
  size?: number;
  className?: string;
}

const DicesButton = ({
  suggestTranslation,
  isRolling = false,
  size = 24,
  className = "",
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
      className={`p-2 text-[var(--gray-6)] rounded-full hover-1 ${className}`}
      aria-label="Suggest an expression"
    >
      <Dices size={size} className={isRolling ? "animate-dice-roll" : ""} />
    </button>
  );
};

export default DicesButton;
