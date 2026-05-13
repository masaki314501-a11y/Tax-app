"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "register">("login")
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    })
    if (res?.ok) {
      router.push("/dashboard")
    } else {
      setError("メールアドレスまたはパスワードが間違っています")
    }
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      // 登録成功後そのままログイン
      const loginRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (loginRes?.ok) router.push("/dashboard")
    } else {
      setError(data.error ?? "登録に失敗しました")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-xl dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-3">📊</div>
          <CardTitle className="text-2xl font-bold dark:text-white">確定申告サポート</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">個人事業主のための確定申告管理ツール</p>
        </CardHeader>
        <CardContent className="pt-4">
          {/* タブ */}
          <div className="flex rounded-lg bg-gray-100 dark:bg-slate-700 p-1 mb-5">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError("") }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  mode === m
                    ? "bg-white dark:bg-slate-600 shadow text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
              >
                {m === "login" ? "ログイン" : "新規登録"}
              </button>
            ))}
          </div>

          <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-3">
            {mode === "register" && (
              <div>
                <Label className="dark:text-gray-300">お名前</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="山田 太郎"
                  className="mt-1 dark:bg-slate-700 dark:border-slate-600"
                />
              </div>
            )}
            <div>
              <Label className="dark:text-gray-300">メールアドレス</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                required
                className="mt-1 dark:bg-slate-700 dark:border-slate-600"
              />
            </div>
            <div>
              <Label className="dark:text-gray-300">パスワード</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === "register" ? "8文字以上" : "パスワード"}
                required
                minLength={mode === "register" ? 8 : 1}
                className="mt-1 dark:bg-slate-700 dark:border-slate-600"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full h-10" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> 処理中...</>
              ) : mode === "login" ? "ログイン" : "アカウントを作成"}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-4">
            ログインすることで利用規約に同意したものとみなされます
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
