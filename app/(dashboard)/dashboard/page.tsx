import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyChart } from "@/components/MonthlyChart"
import { formatCurrency, calcIncomeTax, calcResidentTax } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const year = new Date().getFullYear()
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59)

  const [incomes, expenses, deductions, setting, monthlyIncomes, monthlyExpenses] = await Promise.all([
    prisma.income.aggregate({ where: { userId, date: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ where: { userId, date: { gte: start, lte: end } }, _sum: { amount: true }, _count: true }),
    prisma.deduction.aggregate({ where: { userId, year }, _sum: { amount: true } }),
    prisma.userSetting.findUnique({ where: { userId } }),
    prisma.income.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { date: true, amount: true } }),
    prisma.expense.findMany({ where: { userId, date: { gte: start, lte: end } }, select: { date: true, amount: true } }),
  ])

  const totalIncome = incomes._sum.amount ?? 0
  const totalExpense = expenses._sum.amount ?? 0
  const totalDeduction = deductions._sum.amount ?? 0
  const blueFormDeduction = setting?.blueFormDeduction ?? 0
  const basicDeduction = 480_000
  const profit = totalIncome - totalExpense
  const taxableIncome = Math.max(0, profit - basicDeduction - totalDeduction - blueFormDeduction)
  const incomeTax = calcIncomeTax(taxableIncome)
  const residentTax = calcResidentTax(taxableIncome)
  const totalTax = incomeTax + residentTax

  // 月別集計
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const inc = monthlyIncomes.filter((r) => new Date(r.date).getMonth() + 1 === month).reduce((s, r) => s + r.amount, 0)
    const exp = monthlyExpenses.filter((r) => new Date(r.date).getMonth() + 1 === month).reduce((s, r) => s + r.amount, 0)
    return { month: `${month}月`, income: inc, expense: exp }
  })

  const cards = [
    { title: "売上合計", value: totalIncome, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", count: `${incomes._count}件` },
    { title: "経費合計", value: totalExpense, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/20", count: `${expenses._count}件` },
    { title: "利益", value: profit, icon: Wallet, color: profit >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50 dark:bg-blue-900/20", count: "" },
    { title: "税額合計（概算）", value: totalTax, icon: Receipt, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", count: "" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{year}年 ダッシュボード</h2>
        {blueFormDeduction > 0 && (
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
            青色申告特別控除 {formatCurrency(blueFormDeduction)} 適用中
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map((card) => (
          <Card key={card.title} className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="pt-5">
              <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
              <p className={`text-xl font-bold ${card.color}`}>{formatCurrency(card.value)}</p>
              {card.count && <p className="text-xs text-gray-400 mt-1">{card.count}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm dark:text-white">月別収支（{year}年）</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={monthlyData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader><CardTitle className="text-sm dark:text-white">所得計算（概算）</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "売上合計", value: totalIncome, color: "text-emerald-600" },
              { label: "経費合計", value: -totalExpense, color: "text-red-500", sign: true },
              { label: "利益", value: profit, color: "font-bold text-gray-900 dark:text-white", border: true },
              { label: "基礎控除", value: -basicDeduction, color: "text-purple-600", sign: true },
              { label: "その他控除", value: -(totalDeduction + blueFormDeduction), color: "text-purple-600", sign: true },
              { label: "課税所得", value: taxableIncome, color: "font-bold text-gray-900 dark:text-white", border: true },
            ].map((r) => (
              <div key={r.label} className={`flex justify-between ${r.border ? "border-t pt-2 dark:border-slate-600" : ""}`}>
                <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
                <span className={r.color}>
                  {r.sign && r.value !== 0 ? "−" : ""}{formatCurrency(Math.abs(r.value))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader><CardTitle className="text-sm dark:text-white">税額内訳（概算）</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: "所得税", value: incomeTax, note: "累進課税" },
              { label: "復興特別所得税", value: Math.floor(incomeTax * 0.021), note: "所得税×2.1%" },
              { label: "住民税", value: residentTax, note: "一律10%" },
              { label: "合計", value: totalTax, bold: true },
            ].map((r) => (
              <div key={r.label} className={`flex justify-between items-center ${r.bold ? "border-t pt-2 font-bold dark:border-slate-600" : ""}`}>
                <div>
                  <p className={r.bold ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>{r.label}</p>
                  {r.note && <p className="text-xs text-gray-400">{r.note}</p>}
                </div>
                <span className={r.bold ? "text-orange-600 text-base" : "text-orange-500"}>
                  {formatCurrency(r.value)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
