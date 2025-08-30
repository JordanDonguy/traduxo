"use client"

import { useDeleteAccount } from "@/lib/client/hooks/useDeleteAccount";
import { useRouter } from "next/navigation";

interface DeleteAccountProps {
  showMenu: boolean
}

function DeleteAccount({ showMenu }: DeleteAccountProps) {
  const router = useRouter();

  const { deleteAccount, isLoading } = useDeleteAccount();

  return (
    <div className={`max-w-2xl w-full flex justify-center mx-auto ${showMenu ? "opacity-100" : "opacity-0"} duration-200`}>

      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        < div className="fixed inset-0 bg-(var[--menu]) bg-opacity-60 z-40 flex items-center justify-center">
          <div role="status" className="spinner" />
        </div>
      ) : null}

      <div className={`w-full flex flex-col gap-8 px-2 md:px-8 rounded-lg ${isLoading ? "opacity-60" : "opacity-100"}`}>

        <h1 className="text-2xl text-center font-medium">Delete Account</h1>
        <p className="text-center text-xl py-8">Are you sure you want to delete your account?</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 w-full">

          {/* -------------- Cancel button -------------- */}
          <button
            type="button"
            onClick={() => router.push("/?menu=open")}
            className="h-16 text-center col-span-1 border rounded-full hover:cursor-pointer hover:bg-[var(--hover-2)]"
          >
            Cancel
          </button>

          {/* -------------- Confirm button -------------- */}
          <button
            type="button"
            onClick={deleteAccount}
            className="h-16 text-center col-span-1 rounded-full bg-red-600 hover:cursor-pointer hover:bg-red-500 text-gray-100"
          >
            Yes
          </button>

        </div>
      </div>
    </div>
  )
}

export default DeleteAccount
