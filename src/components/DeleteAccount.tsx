"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";

interface DeleteAccountProps {
  showMenu: boolean
}

function DeleteAccount({ showMenu }: DeleteAccountProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const deleteAccount = async () => {
    setIsLoading(true);     // To trigger loading spinner

    const res = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || "Failed to delete account");
      router.push("/")
    };

    await signOut({ callbackUrl: "/?delete=true" });    // Sign out after account's deleted
    setIsLoading(false);
    router.push("/")
  }

  return (
    <div className={`max-w-2xl w-full flex justify-center mx-auto ${showMenu ? "opacity-100" : "opacity-0"} duration-200`}>

      {/* -------------- Loading spinner -------------- */}
      {isLoading ? (
        < div className="fixed inset-0 bg-(var[--menu]) bg-opacity-60 z-40 flex items-center justify-center">
          <div className="spinner" />
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
