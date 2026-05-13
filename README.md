# 確定申告サポートツール

個人事業主向けの確定申告サポートWebアプリ

## 技術スタック

- **Next.js 16** + TypeScript + App Router
- **NextAuth.js v5** (Auth.js) + Google OAuth
- **Supabase** (PostgreSQL)
- **Prisma 7**（`@prisma/adapter-pg` 使用）
- **Tailwind CSS**
- **Anthropic SDK**（claude-opus-4-7）レシートOCR
- **PapaParse** CSV読み込み

## セットアップ

### 1. 環境変数

`.env` ファイルを編集して以下を設定：

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
AUTH_SECRET="openssl rand -base64 32 で生成"
AUTH_GOOGLE_ID="Google Cloud ConsoleのOAuth クライアントID"
AUTH_GOOGLE_SECRET="Google Cloud ConsoleのOAuth クライアントシークレット"
ANTHROPIC_API_KEY="Anthropic APIキー"
```

### 2. DBマイグレーション

```bash
npx prisma migrate dev --name init
```

### 3. 開発サーバー起動

```bash
npm run dev
```

## 機能

| 機能 | 説明 |
|------|------|
| Googleログイン | OAuth認証、ユーザーデータは完全分離 |
| ダッシュボード | 年間サマリー・税額概算 |
| 収入管理 | 収入の登録・一覧・削除 |
| 経費管理 | 経費の登録・一覧・科目別集計 |
| レシートスキャン | 写真→Claude AIで日付・金額・科目を自動抽出 |
| CSV取り込み | 銀行明細CSVの一括インポート |
| 控除入力 | 医療費・ふるさと納税等の入力 |
| 税額試算 | 所得税・復興税・住民税の概算計算 |

## 免責事項

本ツールの税額計算はあくまで概算です。正確な申告には税理士への相談を推奨します。
