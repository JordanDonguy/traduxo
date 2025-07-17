"use client"

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { CircleX } from "lucide-react";

type UserMenuProps = {
  showMenu?: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
};

function UserMenu({ showMenu, setShowMenu }: UserMenuProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // avoid React‑server‑component → client hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;               // render nothing on the server pass

  const isDark = theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`z-30 fixed w-full h-full flex flex-col gap-6 items-center pt-20 px-6 xl:px-0 duration-400 origin-top ${showMenu ? "scale-y-100 bg-[var(--menu)]" : "scale-y-0 bg-[var(--bg)]"}`}>
      <div className="flex justify-between w-full max-w-2xl">
        <h2 className="text-2xl">User Settings</h2>
        <button
          onClick={() => setShowMenu(false)}
          className="hover:cursor-pointer hover:scale-125 active:scale-90 duration-150"
        >
          <CircleX />
        </button>
      </div>

      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label="Toggle colour scheme"
        className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
      >
        {isDark ? <Sun /> : <Moon />}
        <span className="pl-6 text-xl">Theme ({theme})</span>
      </button>
    </div>
  )
}

export default UserMenu
