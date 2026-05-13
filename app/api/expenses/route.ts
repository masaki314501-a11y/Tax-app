import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      },
    },
    orderBy: { date: "desc" },
  })

  return Response.json(expenses)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const expense = await prisma.expense.create({
    data: {
      userId: session.user.id,
      date: new Date(body.date),
      description: body.description,
      amount: parseInt(body.amount),
      taxRate: parseInt(body.taxRate ?? "10"),
      category: body.category,
      memo: body.memo ?? null,
    },
  })

  return Response.json(expense)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  await prisma.expense.deleteMany({
    where: { id, userId: session.user.id },
  })

  return Response.json({ success: true })
}
