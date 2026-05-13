import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { rows, type } = body // type: "income" | "expense"

  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: "データが空です" }, { status: 400 })
  }

  if (type === "income") {
    await prisma.income.createMany({
      data: rows.map((row: { date: string; description: string; amount: number; category?: string; memo?: string }) => ({
        userId: session.user!.id!,
        date: new Date(row.date),
        description: row.description,
        amount: Number(row.amount),
        category: row.category ?? "売上",
        memo: row.memo ?? null,
      })),
    })
  } else {
    await prisma.expense.createMany({
      data: rows.map((row: { date: string; description: string; amount: number; category?: string; memo?: string }) => ({
        userId: session.user!.id!,
        date: new Date(row.date),
        description: row.description,
        amount: Number(row.amount),
        category: row.category ?? "雑費",
        memo: row.memo ?? null,
      })),
    })
  }

  return Response.json({ count: rows.length })
}
