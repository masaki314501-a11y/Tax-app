"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full text-xs dark:border-slate-600 dark:text-gray-300"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      ログアウト
    </Button>
  )
}
