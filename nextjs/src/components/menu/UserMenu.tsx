"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useAuthHandlers } from "@traduxo/packages/hooks/auth/useAuthHandlers";
import { useApp } from "@traduxo/packages/contexts/AppContext";
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
import MenuButton from "./MenuButton";

interface UserMenuProps {
  showMenu: boolean;
  submenu: string | null;
  pathname: string;
}

function UserMenu({ showMenu, submenu, pathname }: UserMenuProps) {
  const { showLoginForm, setShowLoginForm } = useApp();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { handleLogout } = useAuthHandlers();
  const { status, providers, refresh } = useAuth();
  const isCredentials = providers?.includes("Credentials");

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
        z-40 fixed top-12 w-full md:w-3/4 md:left-[25%] lg:w-1/2 lg:left-[50%] h-full flex justify-center pt-8 px-4 xl:px-0
        inset-0 max-h-screen duration-400 origin-right md:border-l border-zinc-500 bg-[var(--bg)] scrollbar-hidden
        ${showMenu ? "translate-x-0" : "-translate-x-300 md:translate-x-300"}`}
    >
      {(isLoading) ? (
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
                id="back-to-menu-button"
                aria-label="Back to main menu"
                onClick={() => router.replace(`${pathname}?menu=open`)}
                className="hover:cursor-pointer hover:scale-125 active:scale-90 duration-150"
              >
                <CircleArrowLeft />
              </button>
            ) : null}

            {/* -------------- Close Menu button -------------- */}
            <button
              id="close-menu-button"
              aria-label="Close user menu"
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
                <MenuButton
                  id="theme-toggle-button"
                  label={`Theme (${theme})`}
                  icon={isDark ? <Moon /> : <Sun />}
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                />

                {/* -------------- Explanation language -------------- */}
                <MenuButton
                  id="explanation-language-button"
                  label="Explanation language"
                  icon={<Languages />}
                  onClick={() => {
                    setShowExplanationLang(true);
                    router.push(`${pathname}?menu=open&submenu=explanationLang`);
                  }}
                />

                {/* -------------- Login button -------------- */}
                {status !== "authenticated" && (
                  <MenuButton
                    id="login-button"
                    label="Login"
                    icon={<User />}
                    onClick={() => {
                      setShowLogin(true);
                      router.push(`${pathname}?menu=open&submenu=login`);
                    }}
                  />
                )}

                {/* -------------- History -------------- */}
                <MenuButton
                  id="history-button"
                  label="History"
                  icon={<History />}
                  onClick={() => {
                    setShowHistory(true);
                    router.push(`${pathname}?menu=open&submenu=history`);
                  }}
                />

                {/* -------------- Favorites -------------- */}
                <MenuButton
                  id="favorites-button"
                  label="Favorites"
                  icon={<Star />}
                  onClick={() => {
                    setShowFavorites(true);
                    router.push(`${pathname}?menu=open&submenu=favorites`);
                  }}
                />

                {/* -------------- Privacy policy -------------- */}
                <MenuButton
                  id="privacy-policy-button"
                  label="Privacy policy"
                  icon={<Shield />}
                  onClick={() => {
                    setIsLoading(true);
                    router.push("/privacy");
                  }}
                />

                {/* Authenticated actions */}
                {(status === "authenticated") && (
                  <>
                    {/* -------------- Change password -------------- */}
                    <MenuButton
                      id="change-password-button"
                      label={isCredentials ? "Change password" : "Create password"}
                      icon={<Lock />}
                      onClick={() => {
                        setShowChangePassword(true);
                        router.push(`${pathname}?menu=open&submenu=changePassword`);
                      }}
                    />

                    {/* -------------- Log Out -------------- */}
                    <MenuButton
                      id="logout-button"
                      label="Log Out"
                      icon={<LogOut />}
                      onClick={async () => {
                        setIsLoading(true);
                        const success = await handleLogout(refresh, setIsLoading);
                        if (success) router.push("/?logout=true");
                      }}
                    />

                    {/* -------------- Delete account -------------- */}
                    <MenuButton
                      id="delete-account-button"
                      label="Delete account"
                      icon={<BadgeMinus />}
                      onClick={() => {
                        setShowDeleteAccount(true);
                        router.push(`${pathname}?menu=open&submenu=deleteAccount`);
                      }}
                    />
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
