import initSqlJs from "sql.js"

let SQLPromise: Promise<any> | null = null
let dbInstance: any | null = null

const locateWasm = () =>
  "https://cdn.jsdelivr.net/npm/sql.js@1.10.0/dist/sql-wasm.wasm"

const LS_KEY = "sqlite-db"

function toBase64(bytes: Uint8Array): string {
  let binary = ""
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export async function getDB() {
  if (!SQLPromise) {
    SQLPromise = initSqlJs({ locateFile: locateWasm })
  }
  const SQL = await SQLPromise

  if (!dbInstance) {
    const saved = localStorage.getItem(LS_KEY)
    if (saved) {
      const bytes = fromBase64(saved)
      dbInstance = new SQL.Database(bytes)
    } else {
      dbInstance = new SQL.Database()
    }
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT PRIMARY KEY,
        confirmations TEXT,
        updated_at TEXT
      );
    `)
  }
  return dbInstance
}

function persistDB(db: any) {
  const bytes = db.export() as Uint8Array
  localStorage.setItem(LS_KEY, toBase64(bytes))
}

export async function loadConfirmationsFromSqlite(userId: string): Promise<Record<string, { confirmed: boolean; date: string }> | null> {
  const db = await getDB()
  const stmt = db.prepare("SELECT confirmations FROM user_progress WHERE user_id = ? LIMIT 1")
  const result: string[] = []
  stmt.bind([userId])
  while (stmt.step()) {
    const row = stmt.getAsObject() as any
    result.push(row.confirmations as string)
  }
  stmt.free()
  if (result.length === 0) return null
  try {
    return JSON.parse(result[0] || "{}")
  } catch {
    return null
  }
}

export async function saveConfirmationsToSqlite(userId: string, data: Record<string, { confirmed: boolean; date: string }>) {
  const db = await getDB()
  const now = new Date().toISOString()
  const json = JSON.stringify(data)
  db.run(
    "INSERT INTO user_progress (user_id, confirmations, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET confirmations = excluded.confirmations, updated_at = excluded.updated_at",
    [userId, json, now]
  )
  persistDB(db)
}
