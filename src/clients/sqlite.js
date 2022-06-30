import Database from 'better-sqlite3'

const db = new Database('./packet-generator.db')
// db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function getStops () {
  return db.prepare('SELECT name FROM stops').all().map(row => row.name)
}

export function getCoordinatesByStopName (name) {
  return db.prepare(`SELECT coordinates FROM stops WHERE name = ?`).get(name).coordinates
}

export function getDirections ([origin, destination]) {
  const directions = db.prepare(`
  SELECT google_directions, updated_at
  FROM directions
  WHERE start_coordinates = ? and end_coordinates = ?
  `).get(origin, destination)

  if (directions) {
    console.log(`Cache hit for directions, last updated: ${directions.updated_at}`)
    return JSON.parse(directions.google_directions)
  }

  console.log('Cache miss for directions')
  return undefined
}

export function saveDirections(start, end, directions) {
  db.prepare(`
  INSERT INTO directions (start_coordinates, end_coordinates, google_directions)
  VALUES (?, ?, ?)
  `).run(start, end, directions)
}
