"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from "@/lib/utils"
import { Trash2, Plus, Download, ChevronUp } from "lucide-react"

type Expense = {
  id: string; date: string; description: string; amount: number
  taxRate: number; category: string; memo: string | null
}

const currentYear = new Date().getFullYear()

export default function ExpensesPage() {
  const { toast } = useToast()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [year, setYear] = useState(currentYear)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "", amount: "", taxRate: "10", category: "交通費", memo: "",
  })

  const fetchExpenses = useCallback(async () => {
    const res = await fetch(`/api/expenses?year=${year}`)
    setExpenses(await res.json())
  }, [year])

  useEffect(() => { fetchExpenses() }, [fetchExpenses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast("経費を登録しました")
      setForm({ date: new Date().toISOString().split("T")[0], description: "", amount: "", taxRate: "10", category: "交通費", memo: "" })
      setShowForm(false)
      await fetchExpenses()
    } else {
      toast("登録に失敗しました", "error")
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" })
    toast("削除しました")
    await fetchExpenses()
  }

  const handleExport = () => {
    const header = "日付,内容,科目,金額,消費税率,メモ"
    const rows = expenses.map((e) =>
      `${formatDate(e.date)},${e.description},${e.category},${e.amount},${e.taxRate}%,${e.memo ?? ""}`
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `経費_${year}.csv`; a.click()
    toast("CSVをダウンロードしました")
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">🧾 経費管理</h2>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="border rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => <option key={y} value={y}>{y}年</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={expenses.length === 0}
            className="dark:border-slate-600 dark:text-gray-300">
            <Download className="h-3.5 w-3.5" /> CSV出力
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <ChevronUp className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showForm ? "閉じる" : "追加"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-5 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader><CardTitle className="text-sm dark:text-white">経費を追加</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div><Label className="dark:text-gray-300">日付</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="dark:bg-slate-700 dark:border-slate-600" /></div>
              <div><Label className="dark:text-gray-300">科目</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="dark:text-gray-300">消費税率</Label>
                <Select value={form.taxRate} onValueChange={(v) => setForm({ ...form, taxRate: v })}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%（標準）</SelectItem>
                    <SelectItem value="8">8%（軽減）</SelectItem>
                    <SelectItem value="0">非課税</SelectItem>
                  </SelectContent>
                </Select></div>
              <div><Label className="dark:text-gray-300">内容</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="内容" required className="dark:bg-slate-700 dark:border-slate-600" /></div>
              <div><Label className="dark:text-gray-300">金額（税込・円）</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="5500" required className="dark:bg-slate-700 dark:border-slate-600" /></div>
              <div><Label className="dark:text-gray-300">メモ</Label>
                <Input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="任意" className="dark:bg-slate-700 dark:border-slate-600" /></div>
              <div className="col-span-2 md:col-span-3 flex gap-2">
                <Button type="submit" disabled={loading}>{loading ? "保存中..." : "保存"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="dark:border-slate-600 dark:text-gray-300">キャンセル</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="md:col-span-2 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="text-sm flex justify-between dark:text-white">
              <span>経費一覧（{year}年）</span>
              <span className="text-red-500">{formatCurrency(total)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-sm">まだ経費データがありません</p>
                <Button size="sm" className="mt-3" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" /> 追加する</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-slate-700">
                      {["日付", "内容", "科目", "税率", "金額", ""].map((h) => (
                        <th key={h} className="py-2 px-1 text-left text-xs text-gray-500 dark:text-gray-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="py-2.5 px-1 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(expense.date)}</td>
                        <td className="py-2.5 px-1 dark:text-gray-200">{expense.description}</td>
                        <td className="py-2.5 px-1">
                          <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full text-xs">{expense.category}</span>
                        </td>
                        <td className="py-2.5 px-1 text-xs text-gray-500 dark:text-gray-400">{expense.taxRate}%</td>
                        <td className="py-2.5 px-1 text-right font-medium text-red-500">{formatCurrency(expense.amount)}</td>
                        <td className="py-2.5 px-1">
                          <button onClick={() => handleDelete(expense.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader><CardTitle className="text-sm dark:text-white">科目別合計</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(byCategory).sort(([, a], [, b]) => b - a).map(([cat, amount]) => (
                <div key={cat} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400 text-xs truncate">{cat}</span>
                  <span className="font-medium text-red-500 text-xs">{formatCurrency(amount)}</span>
                </div>
              ))}
              {Object.keys(byCategory).length === 0 && (
                <p className="text-xs text-gray-400">データなし</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
