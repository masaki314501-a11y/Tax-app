"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { EXPENSE_CATEGORIES, formatCurrency } from "@/lib/utils"
import { Camera, Upload, Loader2, CheckCircle } from "lucide-react"

type ScanResult = {
  date: string
  vendor: string
  total: number
  category: string
  description: string
  items?: { name: string; amount: number }[]
}

export default function ScanPage() {
  const { toast } = useToast()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editForm, setEditForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "雑費",
    memo: "",
  })

  const handleFile = (file: File) => {
    setImage(file)
    setResult(null)
    setSaved(false)
    setError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const handleScan = async () => {
    if (!image) return
    setScanning(true)
    setError(null)

    const formData = new FormData()
    formData.append("image", image)

    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "スキャン失敗")
      setResult(data)
      setEditForm({
        date: data.date ?? new Date().toISOString().split("T")[0],
        description: data.description ?? data.vendor ?? "",
        amount: String(data.total ?? ""),
        category: data.category ?? "雑費",
        memo: data.vendor ?? "",
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setScanning(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      toast("経費として登録しました")
      setSaved(true)
      setImage(null)
      setPreview(null)
      setResult(null)
    } else {
      toast("登録に失敗しました", "error")
    }
    setSaving(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📷 レシートスキャン</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* 左: アップロード */}
        <Card>
          <CardHeader><CardTitle className="text-base">レシート写真をアップロード</CardTitle></CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="レシート" className="max-h-64 mx-auto rounded object-contain" />
              ) : (
                <div className="space-y-2">
                  <Camera className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="text-sm text-gray-500">クリックして画像を選択</p>
                  <p className="text-xs text-gray-400">JPG / PNG / WebP対応</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            {image && (
              <Button className="w-full mt-4" onClick={handleScan} disabled={scanning}>
                {scanning ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> AI解析中...</>
                ) : (
                  <><Upload className="h-4 w-4" /> Claude AIで解析</>
                )}
              </Button>
            )}

            {error && (
              <p className="mt-3 text-sm text-red-500 bg-red-50 p-3 rounded">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* 右: 解析結果 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {result ? "解析結果（確認・修正してから登録）" : "解析結果"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result && !saved && (
              <div className="text-center py-12 text-gray-400">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">レシートをアップロードして解析してください</p>
              </div>
            )}

            {saved && (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-green-600 font-medium">経費として登録しました</p>
                <Button variant="outline" className="mt-4" onClick={() => setSaved(false)}>
                  続けてスキャン
                </Button>
              </div>
            )}

            {result && !saved && (
              <div className="space-y-4">
                {result.items && result.items.length > 0 && (
                  <div className="bg-gray-50 rounded p-3 text-sm">
                    <p className="font-medium text-gray-700 mb-1">検出された品目</p>
                    {result.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-gray-600">
                        <span>{item.name}</span>
                        <span>{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>日付</Label>
                    <Input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                  </div>
                  <div>
                    <Label>金額（円）</Label>
                    <Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <Label>内容</Label>
                    <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                  </div>
                  <div>
                    <Label>科目</Label>
                    <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>店舗名（メモ）</Label>
                    <Input value={editForm.memo} onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })} />
                  </div>
                </div>

                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "経費として登録"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
