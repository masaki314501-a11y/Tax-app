import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  const { name, email, password } = await request.json()

  if (!email || !password) {
    return Response.json({ error: "メールアドレスとパスワードは必須です" }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: "パスワードは8文字以上にしてください" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name: name || null, email, passwordHash },
  })

  return Response.json({ id: user.id, email: user.email })
}
