import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, calcIncomeTax, calcResidentTax } from "@/lib/utils"
import { AlertTriangle } from "lucide-react"

export default async function TaxPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const year = new Date().getFullYear()
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59)

  const [incomes, expenses, deductions, setting] = await Promise.all([
    prisma.income.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { amount: true, taxRate: true } }),
    prisma.expense.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { amount: true, taxRate: true } }),
    prisma.deduction.aggregate({ where: { userId, year }, _sum: { amount: true } }),
    prisma.userSetting.findUnique({ where: { userId } }),
  ])

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
  const totalDeduction = deductions._sum.amount ?? 0
  const basicDeduction = 480_000
  const blueFormDeduction = setting?.blueFormDeduction ?? 0

  // 消費税集計
  const salesTax10 = incomes.filter((i) => i.taxRate === 10).reduce((s, i) => s + Math.floor(i.amount * 10 / 110), 0)
  const salesTax8 = incomes.filter((i) => i.taxRate === 8).reduce((s, i) => s + Math.floor(i.amount * 8 / 108), 0)
  const purchaseTax10 = expenses.filter((e) => e.taxRate === 10).reduce((s, e) => s + Math.floor(e.amount * 10 / 110), 0)
  const purchaseTax8 = expenses.filter((e) => e.taxRate === 8).reduce((s, e) => s + Math.floor(e.amount * 8 / 108), 0)
  const consumptionTaxDue = (salesTax10 + salesTax8) - (purchaseTax10 + purchaseTax8)

  // 所得税
  const profit = totalIncome - totalExpense
  const taxableIncome = Math.max(0, profit - basicDeduction - totalDeduction - blueFormDeduction)
  const incomeTax = calcIncomeTax(taxableIncome)
  const revivalTax = Math.floor(incomeTax * 0.021)
  const residentTax = calcResidentTax(taxableIncome)
  const totalIncomeTax = incomeTax + revivalTax + residentTax

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">🔢 {year}年 税額試算</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* 所得計算 */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader><CardTitle className="text-sm dark:text-white">所得計算</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {[
              { label: "総売上", value: totalIncome, color: "text-emerald-600" },
              { label: "経費合計", value: totalExpense, color: "text-red-500", minus: true },
              { label: "利益", value: profit, color: "font-semibold dark:text-white", border: true },
              { label: "基礎控除", value: basicDeduction, color: "text-purple-600", minus: true },
              blueFormDeduction > 0 ? { label: "青色申告特別控除", value: blueFormDeduction, color: "text-blue-600", minus: true } : null,
              totalDeduction > 0 ? { label: "その他控除", value: totalDeduction, color: "text-purple-600", minus: true } : null,
              { label: "課税所得", value: taxableIncome, color: "font-semibold dark:text-white", border: true },
            ].filter(Boolean).map((r) => r && (
              <div key={r.label} className={`flex justify-between ${r.border ? "border-t pt-2 dark:border-slate-600" : ""}`}>
                <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
                <span className={r.color}>
                  {r.minus ? "−" : ""}{formatCurrency(r.value)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 所得税 */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader><CardTitle className="text-sm dark:text-white">所得税・住民税（概算）</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {[
              { label: "所得税", value: incomeTax, note: "累進課税（5〜45%）" },
              { label: "復興特別所得税", value: revivalTax, note: "所得税×2.1%" },
              { label: "住民税", value: residentTax, note: "一律10%" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">{r.label}</p>
                  <p className="text-xs text-gray-400">{r.note}</p>
                </div>
                <span className="text-orange-500">{formatCurrency(r.value)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2 dark:border-slate-600 font-semibold">
              <span className="dark:text-white">合計</span>
              <span className="text-orange-600 text-lg">{formatCurrency(totalIncomeTax)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 消費税 */}
      <Card className="mb-5 dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm dark:text-white">消費税試算（参考）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: "売上消費税 10%", value: salesTax10, color: "text-emerald-600" },
              { label: "売上消費税 8%", value: salesTax8, color: "text-emerald-600" },
              { label: "仕入消費税 10%", value: purchaseTax10, color: "text-red-500" },
              { label: "仕入消費税 8%", value: purchaseTax8, color: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                <p className={`font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-sm text-blue-700 dark:text-blue-300">納付消費税（売上税−仕入税）</p>
              <p className={`font-bold text-lg ${consumptionTaxDue >= 0 ? "text-blue-700 dark:text-blue-300" : "text-red-500"}`}>
                {formatCurrency(consumptionTaxDue)}
              </p>
            </div>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
              ※課税事業者の場合の参考値。免税事業者は消費税申告不要です。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          この試算はあくまで概算です。青色申告特別控除・専従者控除・各種特例等により実際の納税額は異なる場合があります。
          正確な申告には税理士への相談を推奨します。
        </p>
      </div>
    </div>
  )
}
