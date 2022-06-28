import Database from 'better-sqlite3'

const db = new Database('./packet-generator.db')
// db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function getStops () {
  const res = db.prepare('SELECT name FROM stops').all()
    .map(row => row.name)
  return res
}
