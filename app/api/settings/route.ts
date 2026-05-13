import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const setting = await prisma.userSetting.findUnique({ where: { userId: session.user.id } })
  return Response.json(setting ?? { blueFormDeduction: 0, homeOfficeRatio: 0, carRatio: 0 })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const setting = await prisma.userSetting.upsert({
    where: { userId: session.user.id },
    update: {
      blueFormDeduction: Number(body.blueFormDeduction ?? 0),
      homeOfficeRatio: Number(body.homeOfficeRatio ?? 0),
      carRatio: Number(body.carRatio ?? 0),
    },
    create: {
      userId: session.user.id,
      blueFormDeduction: Number(body.blueFormDeduction ?? 0),
      homeOfficeRatio: Number(body.homeOfficeRatio ?? 0),
      carRatio: Number(body.carRatio ?? 0),
    },
  })
  return Response.json(setting)
}
