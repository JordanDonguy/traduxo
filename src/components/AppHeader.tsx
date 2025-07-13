"use client"

import { useState } from "react";
import UserMenu from "./UserMenu";
import { User } from "lucide-react"

function AppHeader() {
  const [showMenu, setShowMenu] = useState<boolean>(false);

  return (
    <header className="w-full h-full flex justify-center">

      <UserMenu showMenu={showMenu} setShowMenu={setShowMenu} />

      <div className="z-30 fixed w-full max-w-6xl h-12 bg-[var(--bg-2)] rounded-b-4xl flex items-center justify-between pl-6 pr-4 xl:pl-8 xl:pr-6">
        <h1 className="text-xl">Smart Translator</h1>
  
        <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer"
        >
          <User />
        </button>
      </div>
    </header>
  )
}

export default AppHeader