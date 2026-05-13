import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { NavLink } from "@/components/NavLink"
import { ThemeToggle } from "@/components/ThemeToggle"
import { SignOutButton } from "@/components/SignOutButton"
import { MobileSidebar } from "@/components/MobileSidebar"

export const navItems = [
  { href: "/dashboard", icon: "📊", label: "ダッシュボード" },
  { href: "/income",    icon: "💰", label: "収入管理" },
  { href: "/expenses",  icon: "🧾", label: "経費管理" },
  { href: "/scan",      icon: "📷", label: "レシートスキャン" },
  { href: "/csv",       icon: "📂", label: "CSV取り込み" },
  { href: "/deductions",icon: "✂️",  label: "控除・設定" },
  { href: "/tax",       icon: "🔢", label: "税額試算" },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-900">
      {/* デスクトップサイドバー */}
      <aside className="hidden md:flex w-60 flex-col bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 fixed inset-y-0">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">確定申告サポート</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">個人事業主向け</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2 px-2">
            <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300 shrink-0">
              {(session.user?.name ?? session.user?.email ?? "?")[0].toUpperCase()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{session.user?.name ?? session.user?.email}</p>
            <ThemeToggle />
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* モバイルヘッダー */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <MobileSidebar navItems={navItems} userName={session.user?.name ?? session.user?.email ?? ""} />
          <span className="font-bold text-sm text-gray-900 dark:text-white">確定申告サポート</span>
        </div>
        <ThemeToggle />
      </div>

      {/* メインコンテンツ */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="p-4 md:p-6 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
