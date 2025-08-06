"use client"

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import { Moon, Sun, User, LogOut, Lock } from "lucide-react";
import { CircleArrowLeft, CircleX } from "lucide-react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

type UserMenuProps = {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
};

function UserMenu({ showMenu, setShowMenu }: UserMenuProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [isChangePassword, setIsChangePassword] = useState<boolean>(false);
  
  const { status, data: session } = useSession();
  const isCredentials = session?.user.providers?.includes("Credentials");
  
  // avoid React‑server‑component → client hydration mismatch
  useEffect(() => setMounted(true), []);

  // When closing menu, reset submenus state (so that menu reopens on main page next time)
  useEffect(() => {
    if (!showMenu) {
      setTimeout(() => {
        setIsLogin(false)
        setIsChangePassword(false)
      }, 500)
    }
  }, [showMenu])

  // Fetch user theme preference
  const isDark = useMemo(() => {
    if (!mounted) return false;
    return theme === 'dark' || (
      theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }, [theme, mounted]);

  // Back to menu (left arrow button)
  const backToMenu = () => {
    setIsLogin(false);
    setIsChangePassword(false);
  };

  if (!mounted) return null;

  return (
    <div className={`
      z-30 fixed w-full h-full  flex justify-center pt-20 px-6 xl:px-0 duration-400 origin-top
      inset-0 overflow-y-auto max-h-screen
      ${showMenu ? "scale-y-100 bg-[var(--menu)]" : "scale-y-0 bg-[var(--bg)]"}`}
    >
      <div className={`absolute w-full flex max-w-2xl mx-auto px-6 xl:px-0 pt-1 
        ${isLogin || isChangePassword ? "justify-between" : "justify-end"}`}
      >

        {/* -------------- Back to Menu button -------------- */}
        {isLogin || isChangePassword ? (
          <button
            onClick={backToMenu}
            className="hover:cursor-pointer hover:scale-125 active:scale-90 duration-150"
          >
            <CircleArrowLeft />
          </button>
        ) : null}

        {/* -------------- Close Menu button -------------- */}
        <button
          onClick={() => setShowMenu(false)}
          className="right-0 hover:cursor-pointer hover:scale-125 active:scale-90 duration-150"
        >
          <CircleX />
        </button>
      </div>
      {isLogin ?
        <Login showMenu={showMenu} setShowMenu={setShowMenu} />
        : isChangePassword ?
          <ChangePassword showMenu={showMenu} setShowMenu={setShowMenu} isCredentials={isCredentials} />
          : (
            <div className="max-w-2xl w-full h-full flex flex-col gap-6 items-center">
              <div className="flex justify-between w-full">
                <h2 className="text-2xl">User Settings</h2>
              </div>

              {/* -------------- Theme button -------------- */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label="Toggle colour scheme"
                className="w-full h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
              >
                {isDark ? <Sun /> : <Moon />}
                <span className="pl-6 text-xl">Theme ({theme})</span>
              </button>

              {/* -------------- Login button -------------- */}
              {status === "authenticated" ? null : (
                <button
                  onClick={() => setIsLogin(true)}
                  aria-label="Toggle colour scheme"
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
                >
                  <User />
                  <span className="pl-6 text-xl">Login</span>
                </button>
              )}

              {/* -------------- Log Out button -------------- */}
              {status === "authenticated" ? (
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/?logout=true" });
                    setShowMenu(false)
                  }}
                  aria-label="Toggle colour scheme"
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
                >
                  <LogOut />
                  <span className="pl-6 text-xl">Log Out</span>
                </button>
              ) : null}

              {/* -------------- Change password button -------------- */}
              {status === "authenticated" ? (
              <button
                onClick={() => setIsChangePassword(true)}
                aria-label="Toggle colour scheme"
                className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
              >
                <Lock />
                <span className="pl-6 text-xl">{isCredentials ? "Change password" : "Create password"}</span>
              </button>
              ) : null }
            </div>
          )}
    </div>
  )
}

export default UserMenu
