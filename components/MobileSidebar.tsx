"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { NavLink } from "@/components/NavLink"
import { SignOutButton } from "@/components/SignOutButton"

type Props = {
  navItems: { href: string; icon: string; label: string }[]
  userName: string
}

export function MobileSidebar({ navItems, userName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-1 text-gray-600 dark:text-gray-300">
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative z-50 w-64 bg-white dark:bg-slate-800 flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                  {(userName || "?")[0].toUpperCase()}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">{userName}</p>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto" onClick={() => setOpen(false)}>
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>
            <div className="p-3 border-t dark:border-slate-700">
              <SignOutButton />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
