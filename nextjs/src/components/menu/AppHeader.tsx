"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import { showAuthToasts } from "@traduxo/packages/utils/ui/authToasts";
import { toast } from "react-toastify";
import { User } from "lucide-react";
import UserMenu from "./UserMenu";
import Logo from "./Logo";
import DicesButton from "../shared/DicesButton";
import Link from "next/link";

function AppHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const submenu = searchParams.get("submenu"); // "login", "history", etc.;
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { showMenu, setShowMenu } = useApp();
  const { refresh } = useAuth();
  const { setTranslatedText, setExplanation } = useTranslationContext();
  const { suggestTranslation, isRolling } = useSuggestion({});
  
  // State and ref to hide/show header on scroll (mobile only)
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  // ---------------------------------------------------------------
  // Get url params, if menu-open, open the menu, otherwise close it
  // ---------------------------------------------------------------
  useEffect(() => {
    const menuOpen = searchParams.get("menu") === "open";
    if (menuOpen) {
      setShowMenu(true)
    } else {
      setShowMenu(false)
      // Remove submenu param using router.replace (if it exists in URL)
      if (searchParams.has("submenu")) {
        const params = new URLSearchParams(searchParams);
        params.delete("submenu");

        const newUrl = `${pathname}${params.toString() ? "?" + params.toString() : ""}`;
        if (newUrl !== window.location.pathname + window.location.search) {
          router.replace(newUrl);
        }
      }
    }
  }, [searchParams, pathname, router, setShowMenu]);

  // ----------------------------------------------------------------------------
  // Display a toast message if there's an error or success message in url params
  // ----------------------------------------------------------------------------
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

  // -------------------------------------------------
  // Close the menu if user clicks outside of the menu
  // -------------------------------------------------
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

  // ----------------------------------------
  // Hide/show header on scroll (mobile only)
  // ----------------------------------------
  useEffect(() => {
    function handleScroll() {
      const currentY = document.body.scrollTop;

      if (window.innerWidth < 768) {
        if (currentY > lastScrollY.current && currentY > 50) {
          // scrolling down
          setHidden(true);
        } else {
          // scrolling up
          setHidden(false);
        }
      }

      lastScrollY.current = currentY;
    }

    document.body.addEventListener("scroll", handleScroll);
    return () => document.body.removeEventListener("scroll", handleScroll);
  }, []);


  return (
    <header ref={menuRef} className="w-full h-full flex justify-center">

      <UserMenu showMenu={showMenu} setShowMenu={setShowMenu} submenu={submenu} pathname={pathname} />

      <div
        className={`z-50 inset-x-0 fixed shadow-md w-full h-14 md:h-16 border-b border-[var(--gray-1)] 
          header-gradient flex flex-row-reverse md:flex-row items-center justify-between px-2 md:px-8 
          transition-transform duration-500 ${hidden ? "-translate-y-full md:translate-y-0" : "translate-y-0"}`}
      >

        {/* -------- Mobile Dices Button -------- */}
        <DicesButton
          suggestTranslation={suggestTranslation}
          size={28}
          isRolling={isRolling}
          className="md:hidden text-[var(--text)]"
        />

        <Link
          href={"/"}
          onClick={() => {
            setTranslatedText([]);
            setExplanation("");
          }}>
          <Logo />
        </Link>

        <div>
          {/* -------- Desktop Dices Button -------- */}
          <DicesButton
            suggestTranslation={suggestTranslation}
            size={28}
            isRolling={isRolling}
            className="hidden md:inline text-[var(--text)]"
          />

          {/* -------- User Button -------- */}
          <button
            id="user-menu-button"
            aria-label="User menu"
            onClick={() => {
              if (showMenu) {
                setShowMenu(false);         // close instantly
                router.push(`${pathname}`); // update URL asynchronously
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
