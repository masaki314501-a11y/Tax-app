"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency } from "@/lib/utils"
import { Upload, CheckCircle, AlertCircle } from "lucide-react"
import Papa from "papaparse"

type Row = {
  date: string
  description: string
  amount: number
  category: string
  memo: string
}

export default function CsvPage() {
  const [type, setType] = useState<"income" | "expense">("expense")
  const [rows, setRows] = useState<Row[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ count: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setError(null)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const mapped = results.data.map((row) => ({
          date: row["日付"] ?? row["date"] ?? "",
          description: row["内容"] ?? row["description"] ?? row["摘要"] ?? "",
          amount: Math.abs(Number((row["金額"] ?? row["amount"] ?? row["出金"] ?? "0").replace(/,/g, ""))),
          category: row["科目"] ?? row["category"] ?? (type === "income" ? "売上" : "雑費"),
          memo: row["メモ"] ?? row["memo"] ?? row["備考"] ?? "",
        })).filter((r) => r.date && r.amount > 0)
        setRows(mapped)
      },
      error: () => setError("CSVの読み込みに失敗しました"),
    })
  }

  const handleImport = async () => {
    setUploading(true)
    setError(null)
    const res = await fetch("/api/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, type }),
    })
    const data = await res.json()
    if (res.ok) {
      setResult(data)
      setRows([])
    } else {
      setError(data.error)
    }
    setUploading(false)
  }

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📂 CSV取り込み</h2>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">CSVファイルを読み込む</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="expense" checked={type === "expense"} onChange={() => setType("expense")} />
                経費として取り込む
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="income" checked={type === "income"} onChange={() => setType("income")} />
                収入として取り込む
              </label>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <label className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">CSVファイルを選択</span>
                <span className="text-xs text-gray-400">必要な列: 日付, 内容（or 摘要）, 金額</span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
              </label>
            </div>

            <div className="bg-gray-50 rounded p-3 text-xs text-gray-500">
              <p className="font-medium mb-1">対応CSV形式（ヘッダー行必須）:</p>
              <code>日付,内容,金額,科目,メモ</code>
              <p className="mt-1">または銀行明細: <code>日付,摘要,出金,入金</code></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex justify-between items-center">
              <span>プレビュー（{rows.length}件）</span>
              <Button onClick={handleImport} disabled={uploading} size="sm">
                {uploading ? "取り込み中..." : `${rows.length}件を取り込む`}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="py-2 text-left">日付</th>
                  <th className="py-2 text-left">内容</th>
                  <th className="py-2 text-left">科目</th>
                  <th className="py-2 text-right">金額</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-1">{row.date}</td>
                    <td className="py-1">{row.description}</td>
                    <td className="py-1">
                      <select
                        value={row.category}
                        onChange={(e) => {
                          const updated = [...rows]
                          updated[i] = { ...row, category: e.target.value }
                          setRows(updated)
                        }}
                        className="border rounded text-xs px-1 py-0.5"
                      >
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="py-1 text-right">{formatCurrency(row.amount)}</td>
                  </tr>
                ))}
                {rows.length > 20 && (
                  <tr><td colSpan={4} className="py-2 text-center text-gray-400 text-xs">...他 {rows.length - 20} 件</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span>{result.count}件のデータを取り込みました</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
