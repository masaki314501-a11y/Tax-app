import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))

  const deductions = await prisma.deduction.findMany({
    where: { userId: session.user.id, year },
    orderBy: { type: "asc" },
  })

  return Response.json(deductions)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const deduction = await prisma.deduction.upsert({
    where: {
      userId_year_type: {
        userId: session.user.id,
        year: parseInt(body.year),
        type: body.type,
      },
    },
    update: {
      amount: parseInt(body.amount),
      memo: body.memo ?? null,
    },
    create: {
      userId: session.user.id,
      year: parseInt(body.year),
      type: body.type,
      amount: parseInt(body.amount),
      memo: body.memo ?? null,
    },
  })

  return Response.json(deduction)
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  await prisma.deduction.deleteMany({
    where: { id, userId: session.user.id },
  })

  return Response.json({ success: true })
}
