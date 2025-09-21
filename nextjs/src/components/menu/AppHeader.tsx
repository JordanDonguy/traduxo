"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import { showAuthToasts } from "@traduxo/packages/utils/ui/authToasts";
import { toast } from "react-toastify";
import { User, Dices } from "lucide-react";
import UserMenu from "./UserMenu";
import Logo from "../Logo";

function AppHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const submenu = searchParams.get("submenu"); // "login", "history", etc.;

  const { refresh } = useAuth();
  const { suggestTranslation, isRolling } = useSuggestion({});

  // -------- Menu opening / closing section --------
  const [showMenu, setShowMenu] = useState<boolean>(false);

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
  }, [searchParams, pathname, router]);

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

  return (
    <header className="w-full h-full flex justify-center">

      <UserMenu showMenu={showMenu} submenu={submenu} pathname={pathname} />

      <div className="z-50 fixed w-full max-w-6xl h-14 md:h-12 bg-[var(--bg-2)] rounded-b-4xl shadow-sm flex flex-row-reverse md:flex-row items-center justify-between px-4 xl:pl-8 xl:pr-6">
        <button
          onClick={() => {
            router.push("/");
            suggestTranslation();
          }}
          className="md:hidden p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer"
        >
          <Dices size={28} className={`${isRolling ? "animate-dice-roll" : ""}`} />
        </button>

        <Logo />

        <div>
          <button
            onClick={() => {
              router.push("/");
              suggestTranslation();
            }}
            className="hidden md:inline p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer text-[var(--text)]"
          >
            <Dices className={`${isRolling ? "animate-dice-roll" : ""}`} />
          </button>
          <button
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
