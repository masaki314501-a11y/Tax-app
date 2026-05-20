import { auth } from "@/auth"
import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    const geminiKeys = Object.keys(process.env).filter(k => k.includes("GEMINI"))
    return Response.json({
      error: "GEMINI_API_KEY が設定されていません",
      hint: geminiKeys.length > 0 ? `検出された類似キー: ${geminiKeys.join(", ")}` : "GEMINI関連の環境変数が一切見つかりません",
    }, { status: 503 })
  }

  const formData = await request.formData()
  const file = formData.get("image") as File | null
  if (!file) return Response.json({ error: "画像が必要です" }, { status: 400 })

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return Response.json({ error: "JPG/PNG/GIF/WebP形式のみ対応しています" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString("base64")

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: base64,
        },
      },
      `このレシートまたは領収書を解析して、以下のJSON形式のみで返してください。他のテキストは一切含めないこと。

{
  "date": "YYYY-MM-DD形式の日付",
  "vendor": "店舗名・業者名",
  "total": 金額（数値、税込み合計）,
  "category": "交通費/通信費/消耗品費/接待交際費/広告宣伝費/水道光熱費/地代家賃/外注工賃/修繕費/保険料/租税公課/研修費/会議費/雑費 のいずれか",
  "description": "内容の簡単な説明",
  "items": [{ "name": "商品名", "amount": 金額 }]
}

日付が読み取れない場合は今日の日付、金額は税込み総合計を使用。`,
    ])

    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return Response.json({ error: "レシートの情報を読み取れませんでした" }, { status: 422 })
    return Response.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    const msg = e instanceof Error ? e.message : "不明なエラー"
    return Response.json({ error: `Gemini API エラー: ${msg}` }, { status: 500 })
  }
}
