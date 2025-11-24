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
      onClick={handleClick}
      className={`p-2 rounded-full text-[var(--text)] hover:bg-[var(--hover)] hover:cursor-pointer ${className}`}
      aria-label="Suggest an expression"
    >
      <Dices size={size} className={isRolling ? "animate-dice-roll" : ""} />
    </button>
  );
};

export default DicesButton;
