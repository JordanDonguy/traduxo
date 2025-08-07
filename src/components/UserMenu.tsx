"use client"

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import DeleteAccount from "./DeleteAccount";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { signIn } from "next-auth/react";
import Image from "next/image";
import {
  Moon,
  Sun,
  User,
  LogOut,
  Lock,
  CircleArrowLeft,
  CircleX,
  BadgeMinus
} from "lucide-react";

type UserMenuProps = {
  showMenu: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
};

function UserMenu({ showMenu, setShowMenu }: UserMenuProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState<boolean>(false);

  const { status, data: session } = useSession();
  const isCredentials = session?.user.providers?.includes("Credentials");
  const isGoogle = session?.user.providers?.includes("Google");

  // avoid React‑server‑component → client hydration mismatch
  useEffect(() => setMounted(true), []);

  // When closing menu, reset submenus state (so that menu reopens on main page next time)
  useEffect(() => {
    if (!showMenu) {
      setTimeout(() => {
        setShowLogin(false);
        setShowChangePassword(false);
        setShowDeleteAccount(false);
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
    setShowLogin(false);
    setShowChangePassword(false);
    setShowDeleteAccount(false);
  };

  const handleGoogleButton = async () => {
    try {
      // Call API route to mark start of google linking
      const res = await fetch("/api/auth/google-linking", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to start Google linking");
        setShowMenu(false)
        return
      }

      // Proceed with Google sign-in and callback to your linking page
      await signIn("google", {
        callbackUrl: "/?linked=google"
      });
    } catch (err) {
      toast.error(`Google account linking failed: ${err}`)
      console.error("Google account linking failed:", err);
      setShowMenu(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className={`
      z-30 fixed w-full h-full flex justify-center pt-20 px-6 xl:px-0 duration-400 origin-top
      inset-0 overflow-y-auto max-h-screen
      ${showMenu ? "scale-y-100 bg-[var(--menu)]" : "scale-y-0 bg-[var(--bg)]"}`}
    >
      <div className={`absolute w-full flex max-w-2xl mx-auto px-6 xl:px-0 pt-1 
        ${showLogin || showChangePassword || showDeleteAccount ? "justify-between" : "justify-end"}`}
      >

        {/* -------------- Back to Menu button -------------- */}
        {showLogin || showChangePassword || showDeleteAccount ? (
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
      {showLogin ?
        <Login showMenu={showMenu} setShowMenu={setShowMenu} />
        : showChangePassword ?
          <ChangePassword showMenu={showMenu} setShowMenu={setShowMenu} isCredentials={isCredentials} />
          : showDeleteAccount ? <DeleteAccount showMenu={showMenu} setShowMenu={setShowMenu} setShowDeleteAccount={setShowDeleteAccount} />
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
                  onClick={() => setShowLogin(true)}
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
                  onClick={() => setShowChangePassword(true)}
                  aria-label="Toggle colour scheme"
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
                >
                  <Lock />
                  <span className="pl-6 text-xl">{isCredentials ? "Change password" : "Create password"}</span>
                </button>
              ) : null}

              {/* -------------- Google account linking button -------------- */}
              {(status === "authenticated" && !isGoogle) ? (
                <button
                  onClick={handleGoogleButton}
                  aria-label="Toggle colour scheme"
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
                >
                  <Image
                    src="/google-logo.webp"
                    alt="google-logo"
                    width={24}
                    height={24}
                  />
                  <span className="pl-6 text-xl">Link Google account</span>
                </button>
              ) : null}

              {/* -------------- Delete account button -------------- */}
              {status === "authenticated" ? (
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  aria-label="Toggle colour scheme"
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)]"
                >
                  <BadgeMinus />
                  <span className="pl-6 text-xl">Delete account</span>
                </button>
              ) : null}
            </div>
          )}
    </div>
  )
}

export default UserMenu
