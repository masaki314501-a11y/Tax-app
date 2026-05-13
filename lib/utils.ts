import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date))
}

export const EXPENSE_CATEGORIES = [
  "交通費",
  "通信費",
  "消耗品費",
  "接待交際費",
  "広告宣伝費",
  "水道光熱費",
  "地代家賃",
  "給料賃金",
  "外注工賃",
  "修繕費",
  "保険料",
  "租税公課",
  "研修費",
  "会議費",
  "雑費",
] as const

export const INCOME_CATEGORIES = ["売上", "雑収入", "その他"] as const

export const DEDUCTION_TYPES = [
  "基礎控除",
  "医療費控除",
  "社会保険料控除",
  "生命保険料控除",
  "地震保険料控除",
  "寄附金控除（ふるさと納税）",
  "小規模企業共済等掛金控除",
  "配偶者控除",
  "扶養控除",
] as const

// 所得税率（累進課税）
export function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  const brackets = [
    { limit: 1_950_000, rate: 0.05, deduction: 0 },
    { limit: 3_300_000, rate: 0.10, deduction: 97_500 },
    { limit: 6_950_000, rate: 0.20, deduction: 427_500 },
    { limit: 9_000_000, rate: 0.23, deduction: 636_000 },
    { limit: 18_000_000, rate: 0.33, deduction: 1_536_000 },
    { limit: 40_000_000, rate: 0.40, deduction: 2_796_000 },
    { limit: Infinity, rate: 0.45, deduction: 4_796_000 },
  ]
  for (const b of brackets) {
    if (taxableIncome <= b.limit) {
      return Math.floor(taxableIncome * b.rate - b.deduction)
    }
  }
  return 0
}

// 住民税（概算 10%）
export function calcResidentTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0
  return Math.floor(taxableIncome * 0.1)
}
