import { defineConfig } from "prisma/config"
import path from "path"

const tursoUrl = process.env.TURSO_DATABASE_URL
const tursoToken = process.env.TURSO_AUTH_TOKEN

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: tursoUrl && tursoToken
      ? `${tursoUrl}?authToken=${tursoToken}`
      : `file:${path.join(process.cwd(), "data", "tax.db")}`,
  },
})
