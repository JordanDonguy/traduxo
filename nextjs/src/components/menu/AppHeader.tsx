"use client"

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import { showAuthToasts } from "@traduxo/packages/utils/ui/authToasts";
import { toast } from "react-toastify";
import { User } from "lucide-react";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import DicesButton from "../shared/DicesButton";

function AppHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const submenu = searchParams.get("submenu"); // "login", "history", etc.;
  const menuRef = useRef<HTMLDivElement>(null);

  const { showMenu, setShowMenu } = useApp();
  const { refresh } = useAuth();
  const { suggestTranslation, isRolling } = useSuggestion({});

  // Get url params, if menu-open, open the menu, otherwise close it
  useEffect(() => {
    const menuOpen = searchParams.get("menu") === "open";
    if (menuOpen) {
      setShowMenu(true)
    } else {
      setShowMenu(false)
      // Remove submenu param using router.replace
      const params = new URLSearchParams(searchParams);
      params.delete("submenu");
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, router, setShowMenu]);

  // Display a toast message if there's an error or success message in url params
  useEffect(() => {
    // Convert URLSearchParams to a plain object
    const paramsObj: Record<string, string | boolean> = {};
    searchParams.forEach((value, key) => {
      paramsObj[key] = value === "true" ? true : value === "false" ? false : value;
    });

    // Cleanup only auth-related keys
    showAuthToasts(toast, paramsObj, () => {
      const params = new URLSearchParams(searchParams);
      const authKeys = ["login", "logout", "error", "delete", "reset-password"];
      authKeys.forEach((key) => params.delete(key));

      const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newUrl);
    });

    refresh();
  }, [searchParams, pathname, router, refresh]);

  // Close the menu if user clicks outside of the menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Close the menu
        router.replace(`${pathname}`);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, router, pathname]);

  return (
    <header ref={menuRef} className="w-full h-full flex justify-center">

      <UserMenu showMenu={showMenu} submenu={submenu} pathname={pathname} />

      <div className="z-50 inset-x-0 fixed w-full h-14 md:h-12 border-b border-zinc-500 bg-[var(--bg)] flex flex-row-reverse md:flex-row items-center justify-between px-2 md:px-8">
        {/* -------- Mobile Dices Button -------- */}
        <DicesButton
          suggestTranslation={suggestTranslation}
          size={28}
          isRolling={isRolling}
          className="md:hidden"
        />

        <Logo />

        <div>
          {/* -------- Desktop Dices Button -------- */}
          <DicesButton
            suggestTranslation={suggestTranslation}
            size={28}
            isRolling={isRolling}
            className="hidden md:inline"
          />

          {/* -------- User Button -------- */}
          <button
            id="user-menu-button"
            aria-label="User menu"
            onClick={() => {
              if (showMenu) {
                setShowMenu(false);         // close instantly
                router.push("/");           // update URL asynchronously
              } else {
                setShowMenu(true);          // open instantly
                router.push(`${pathname}/?menu=open`); // update URL asynchronously
              }
            }}
            className="p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer text-[var(--text)]"
          >
            <User size={28} className="md:hidden" />
            <User className="hidden md:block" />
          </button>
        </div>
      </div>
    </header >
  )
}

export default AppHeader
