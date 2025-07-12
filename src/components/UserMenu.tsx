"use client"

import { Moon } from "lucide-react";
import { CircleX } from "lucide-react";

type UserMenuProps = {
  showMenu?: boolean;
  setShowMenu: React.Dispatch<React.SetStateAction<boolean>>;
};

function UserMenu({ showMenu, setShowMenu }: UserMenuProps) {
  return (
    <div className={`z-20 fixed w-full h-full flex flex-col gap-6 items-center pt-20 px-6 xl:px-0 duration-400 origin-top ${showMenu ? "scale-y-100 bg-zinc-900" : "scale-y-0 bg-zinc-950"}`}>
      <div className="flex justify-between w-full max-w-2xl">
        <h2 className="text-2xl">User Settings</h2>
        <button
          onClick={() => setShowMenu(false)}
          className="hover:cursor-pointer hover:scale-125 active:scale-90 duration-150"
        >
          <CircleX />
        </button>
      </div>

      <button className="w-full max-w-2xl h-16 bg-zinc-800 rounded-2xl px-6 flex items-center hover:cursor-pointer hover:bg-zinc-700">
        <Moon />
        <span className="pl-6 text-xl">Theme (dark)</span>
      </button>
    </div>
  )
}

export default UserMenu