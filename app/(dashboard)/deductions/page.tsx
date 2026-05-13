"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { formatCurrency, DEDUCTION_TYPES } from "@/lib/utils"
import { Save, Settings2 } from "lucide-react"

type Deduction = { id: string; type: string; amount: number; memo: string | null }
type Setting = { blueFormDeduction: number; homeOfficeRatio: number; carRatio: number }

const BLUE_FORM_OPTIONS = [
  { value: 650000, label: "65万円（e-Tax・複式簿記）" },
  { value: 550000, label: "55万円（紙申告・複式簿記）" },
  { value: 100000, label: "10万円（簡易帳簿）" },
  { value: 0, label: "適用しない（白色申告）" },
]

const currentYear = new Date().getFullYear()

export default function DeductionsPage() {
  const { toast } = useToast()
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [year, setYear] = useState(currentYear)
  const [saving, setSaving] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [memos, setMemos] = useState<Record<string, string>>({})
  const [setting, setSetting] = useState<Setting>({ blueFormDeduction: 0, homeOfficeRatio: 0, carRatio: 0 })
  const [settingSaving, setSettingSaving] = useState(false)

  const fetchAll = useCallback(async () => {
    const [dedRes, setRes] = await Promise.all([
      fetch(`/api/deductions?year=${year}`),
      fetch("/api/settings"),
    ])
    const ded: Deduction[] = await dedRes.json()
    setDeductions(ded)
    const a: Record<string, string> = {}
    const m: Record<string, string> = {}
    for (const d of ded) { a[d.type] = String(d.amount); m[d.type] = d.memo ?? "" }
    setAmounts(a); setMemos(m)
    if (setRes.ok) setSetting(await setRes.json())
  }, [year])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSave = async (type: string) => {
    setSaving(type)
    const res = await fetch("/api/deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, type, amount: amounts[type] ?? "0", memo: memos[type] ?? "" }),
    })
    if (res.ok) { toast("保存しました"); await fetchAll() }
    else toast("保存に失敗しました", "error")
    setSaving(null)
  }

  const handleSettingSave = async () => {
    setSettingSaving(true)
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setting),
    })
    if (res.ok) toast("設定を保存しました")
    else toast("保存に失敗しました", "error")
    setSettingSaving(false)
  }

  const total = deductions.reduce((s, d) => s + d.amount, 0)
  const basicDeduction = 480_000

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">✂️ 控除・設定</h2>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => <option key={y} value={y}>{y}年</option>)}
        </select>
      </div>

      {/* 青色申告・按分設定 */}
      <Card className="mb-5 border-blue-200 dark:border-blue-800 dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <Settings2 className="h-4 w-4" /> 事業設定（全年度共通）
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs font-medium dark:text-gray-300">青色申告特別控除</Label>
            <Select
              value={String(setting.blueFormDeduction)}
              onValueChange={(v) => setSetting({ ...setting, blueFormDeduction: Number(v) })}
            >
              <SelectTrigger className="mt-1 dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BLUE_FORM_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs dark:text-gray-300">自宅兼事務所の事業割合（%）</Label>
              <p className="text-xs text-gray-400 mb-1">家賃・光熱費に自動適用</p>
              <Input type="number" min="0" max="100"
                value={setting.homeOfficeRatio}
                onChange={(e) => setSetting({ ...setting, homeOfficeRatio: Number(e.target.value) })}
                className="dark:bg-slate-700 dark:border-slate-600" />
            </div>
            <div>
              <Label className="text-xs dark:text-gray-300">車の事業利用割合（%）</Label>
              <p className="text-xs text-gray-400 mb-1">ガソリン・車検費に自動適用</p>
              <Input type="number" min="0" max="100"
                value={setting.carRatio}
                onChange={(e) => setSetting({ ...setting, carRatio: Number(e.target.value) })}
                className="dark:bg-slate-700 dark:border-slate-600" />
            </div>
          </div>

          <Button size="sm" onClick={handleSettingSave} disabled={settingSaving}>
            <Save className="h-3.5 w-3.5" /> {settingSaving ? "保存中..." : "設定を保存"}
          </Button>
        </CardContent>
      </Card>

      {/* 控除合計 */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "基礎控除（自動）", value: basicDeduction },
          { label: "青色申告特別控除", value: setting.blueFormDeduction },
          { label: "その他控除合計", value: total },
        ].map((s) => (
          <Card key={s.label} className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-purple-600">{formatCurrency(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 控除項目一覧 */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader><CardTitle className="text-sm dark:text-white">控除項目の入力（{year}年分）</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEDUCTION_TYPES.filter((t) => t !== "基礎控除").map((type) => (
              <div key={type} className="grid grid-cols-12 gap-2 items-end border-b dark:border-slate-700 pb-3">
                <div className="col-span-3 md:col-span-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{type}</p>
                </div>
                <div className="col-span-4">
                  <Label className="text-xs text-gray-400">金額（円）</Label>
                  <Input type="number" placeholder="0"
                    value={amounts[type] ?? ""}
                    onChange={(e) => setAmounts({ ...amounts, [type]: e.target.value })}
                    className="dark:bg-slate-700 dark:border-slate-600" />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs text-gray-400">メモ</Label>
                  <Input placeholder="領収書番号等"
                    value={memos[type] ?? ""}
                    onChange={(e) => setMemos({ ...memos, [type]: e.target.value })}
                    className="dark:bg-slate-700 dark:border-slate-600" />
                </div>
                <div className="col-span-1">
                  <Button size="icon" variant="outline" onClick={() => handleSave(type)}
                    disabled={saving === type} title="保存"
                    className="dark:border-slate-600 dark:text-gray-300">
                    <Save className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
