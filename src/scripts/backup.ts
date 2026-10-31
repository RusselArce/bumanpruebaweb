import { exec } from "child_process"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
})

const DB_URL = process.env.DB_URL

if (!DB_URL) {
  console.error("❌ Falta DB_URL en .env")
  process.exit(1)
}

const backupDir = path.resolve(process.cwd(), "src/backups")

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true })
}

const fecha = new Date().toISOString().replace(/[:.]/g, "-")
const filePath = path.join(backupDir, `backup_${fecha}.sql`)

const cmd = `pg_dump "${DB_URL}" \
--schema=public \
--schema-only \
--no-owner \
--no-privileges \
--clean \
--if-exists \
-f "${filePath}"`

exec(cmd, (err: Error | null) => {
  if (err) {
    console.error("❌ Error en backup")
    return
  }

  let content = fs.readFileSync(filePath, "utf-8")

  // 🔥 limpiar basura de pg_dump
  content = content
    .replace(/^\\restrict.*$/gm, "")
    .replace(/^\\unrestrict.*$/gm, "")

  // 🔥 AQUI VIENE LO QUE QUERÍAS
  // inyectar trigger automáticamente al final

  const triggerSQL = `

-- 🔥 AUTO TRIGGER AUTH (GENERADO)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_user();

`

  content += triggerSQL

  fs.writeFileSync(filePath, content)

  console.log("✅ Backup completo con trigger incluido:")
  console.log(filePath)
})