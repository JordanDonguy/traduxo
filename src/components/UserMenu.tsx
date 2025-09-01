"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { useTheme } from "next-themes";
import Login from "./Login";
import ChangePassword from "./ChangePassword";
import DeleteAccount from "./DeleteAccount";
import TranslationHistory from "./TranslationHistory";
import ExplanationLanguage from "./ExplanationLanguage";
import FavoriteTranslation from "./FavoriteTranslations";
import {
  Moon,
  Sun,
  User,
  LogOut,
  Lock,
  CircleArrowLeft,
  CircleX,
  BadgeMinus,
  History,
  Star,
  Languages,
  Shield
} from "lucide-react";

interface UserMenuProps {
  showMenu: boolean;
  submenu: string | null;
  pathname: string;
}

function UserMenu({ showMenu, submenu, pathname }: UserMenuProps) {
  const { showLoginForm, setShowLoginForm } = useApp();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false)
    ;
  const { status, data: session } = useSession();
  const isCredentials = session?.user.providers?.includes("Credentials");

  const router = useRouter();

  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [showExplanationLang, setShowExplanationLang] = useState<boolean>(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Reset all submenu states when no submenu is present in the URL (supports back navigation in menu)
  useEffect(() => {
    if (!submenu) {
      [setShowLogin, setShowChangePassword, setShowDeleteAccount, setShowHistory, setShowFavorites, setShowExplanationLang]
        .forEach(fn => fn(false));
    }
  }, [submenu])

  // Open menu and login submenu if global showLoginForm state is true
  useEffect(() => {
    if (showLoginForm) {
      setShowLogin(true);
      router.push(`${pathname}?menu=open&submenu=login`);
      setShowLoginForm(false);
    }
  }, [showLoginForm, setShowLoginForm, router, pathname]);

  // Theme detection
  const isDark = useMemo(() => {
    if (!mounted) return false;
    return (
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, [theme, mounted]);

  if (!mounted) return null;

  return (
    <div
      data-testid="user-menu"
      className={`
        z-40 fixed w-full h-full flex justify-center pt-20 px-6 xl:px-0
        inset-0 max-h-screen duration-400 origin-top
        ${showMenu ? "scale-y-100 bg-[var(--menu)]" : "scale-y-0 bg-[var(--bg)]"}`}
    >
      {(status === "loading" || isLoading) ? (
        <div className="fixed inset-0 bg-[var(--menu)] bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div
            className={`absolute w-full flex max-w-2xl mx-auto px-6 xl:px-0 pt-1
              ${(showLogin || showChangePassword || showDeleteAccount || showHistory || showFavorites || showExplanationLang)
                ? "justify-between"
                : "justify-end"
              }`}
          >
            {/* -------------- Back to Menu button -------------- */}
            {(showLogin || showChangePassword || showDeleteAccount || showHistory || showFavorites || showExplanationLang) ? (
              <button
                onClick={() => router.replace(`${pathname}?menu=open`)}
                className="hover:cursor-pointer hover:scale-125 active:scale-90 duration-150"
              >
                <CircleArrowLeft />
              </button>
            ) : null}

            {/* -------------- Close Menu button -------------- */}
            <button
              onClick={() => router.replace(`${pathname}`)}
              className="right-0 hover:cursor-pointer hover:scale-125 active:scale-90 duration-150"
            >
              <CircleX />
            </button>
          </div>

          {/* -------------- Render submenus -------------- */}
          {showLogin ? (
            <Login showMenu={showMenu} />
          ) : showChangePassword ? (
            <ChangePassword isCredentials={isCredentials} showMenu={showMenu} />
          ) : showDeleteAccount ? (
            <DeleteAccount showMenu={showMenu} />
          ) : showHistory ? (
            <TranslationHistory showMenu={showMenu} />
          ) : showFavorites ? (
            <FavoriteTranslation showMenu={showMenu} />
          ) : showExplanationLang ? (
            <ExplanationLanguage showMenu={showMenu} />
          ) : (
            // Top-level menu
            <div
              data-testid="top-level-menu"
              className={`max-w-2xl w-full flex flex-col gap-6 items-center duration-400 ${showMenu ? "opacity-100" : "opacity-0"
                }`}
            >
              <div className="flex justify-between w-full">
                <h2 className="text-2xl font-medium">User Settings</h2>
              </div>

              <div className="flex flex-col gap-6 items-center w-full max-h-[calc(100dvh-8rem)] pb-8 overflow-y-scroll scrollbar-hide">
                {/* -------------- Theme toggle -------------- */}
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="w-full h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                >
                  {isDark ? <Moon /> : <Sun />}
                  <span className="pl-6 text-xl">Theme ({theme})</span>
                </button>

                {/* -------------- Explanation language -------------- */}
                <button
                  onClick={() => {
                    setShowExplanationLang(true);
                    router.push(`${pathname}?menu=open&submenu=explanationLang`)
                  }}
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                >
                  <Languages />
                  <span className="pl-6 text-xl">Explanation language</span>
                </button>

                {/* -------------- Login button -------------- */}
                {status !== "authenticated" && (
                  <button
                    onClick={() => {
                      setShowLogin(true);
                      router.push(`${pathname}?menu=open&submenu=login`)
                    }}
                    className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                  >
                    <User />
                    <span className="pl-6 text-xl">Login</span>
                  </button>
                )}

                {/* -------------- History -------------- */}
                <button
                  onClick={() => {
                    setShowHistory(true);
                    router.push(`${pathname}?menu=open&submenu=history`)
                  }}
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                >
                  <History />
                  <span className="pl-6 text-xl">History</span>
                </button>

                {/* -------------- Favorites -------------- */}
                <button
                  onClick={() => {
                    setShowFavorites(true);
                    router.push(`${pathname}?menu=open&submenu=favorites`)
                  }}
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                >
                  <Star />
                  <span className="pl-6 text-xl">Favorites</span>
                </button>

                {/* -------------- Privacy policy -------------- */}
                <button
                  onClick={() => {
                    setIsLoading(true);
                    router.push("/privacy")
                  }}
                  className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                >
                  <Shield />
                  <span className="pl-6 text-xl">Privacy policy</span>
                </button>

                {/* Authenticated actions */}
                {status === "authenticated" && (
                  <>
                    {/* -------------- Change password -------------- */}
                    <button
                      onClick={() => {
                        setShowChangePassword(true);
                        router.push(`${pathname}?menu=open&submenu=changePassword`)
                      }}
                      className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                    >
                      <Lock />
                      <span className="pl-6 text-xl">
                        {isCredentials ? "Change password" : "Create password"}
                      </span>
                    </button>

                    {/* -------------- Log Out -------------- */}
                    <button
                      onClick={() => {
                        setIsLoading(true);
                        signOut({ callbackUrl: "/?logout=true" })
                      }}
                      className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                    >
                      <LogOut />
                      <span className="pl-6 text-xl">Log Out</span>
                    </button>

                    {/* -------------- Delete account -------------- */}
                    <button
                      onClick={() => {
                        setShowDeleteAccount(true);
                        router.push(`${pathname}?menu=open&submenu=deleteAccount`)
                      }}
                      className="w-full max-w-2xl h-16 bg-[var(--bg-2)] rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-[var(--hover)] shrink-0"
                    >
                      <BadgeMinus />
                      <span className="pl-6 text-xl">Delete account</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserMenu;
