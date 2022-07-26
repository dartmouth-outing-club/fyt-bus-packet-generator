import Database from 'better-sqlite3'

const db = new Database('./packet-generator.db')
// db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function getAllStops () {
  return db.prepare('SELECT name FROM stops').all().map(row => row.name)
}

export function getStop (name) {
  const stop = db.prepare(`
  SELECT name, special_instructions, coordinates
  FROM stops
  WHERE name = ?`).get(name)

  if (!stop) return undefined

  const specialInstructions = stop.special_instructions
  return { specialInstructions, ...stop }
}

export function getDirections (origin, destination) {
  const directions = db.prepare(`
  SELECT google_directions, updated_at
  FROM directions
  WHERE start_coordinates = ? and end_coordinates = ?
  `).get(origin, destination)

  if (directions) {
    return JSON.parse(directions.google_directions)
  }

  return undefined
}

export function saveDirections (start, end, directions) {
  db.prepare(`
  INSERT INTO directions (start_coordinates, end_coordinates, google_directions)
  VALUES (?, ?, ?)
  `).run(start, end, directions)
}

export function getPacket (name) {
  return db.prepare('SELECT query, html_content FROM packets WHERE name = ?').get(name)
}

export function getAllPacketNames () {
  return db.prepare('SELECT name FROM packets').all().map(row => row.name)
}

export function savePacket (name, query, html) {
  db.prepare(`
  INSERT OR REPLACE INTO packets (name, query, html_content)
  VALUES (?, ?, ?)
  `).run(name, query, html)
}

export function deletePacket (name) {
  const { changes } = db.prepare('DELETE FROM packets WHERE name = ?').run(name)
  console.log(`Deleted ${changes} packet(s)`)
  return changes
}

export function getTrip (name) {
  return db.prepare('SELECT name, num_students FROM trips where name = ?').get(name)
}

export function getAllTrips () {
  return db.prepare('SELECT name, num_students FROM trips').all()
}

export function saveTrip ({ name, num_students }) {
  return db
    .prepare('INSERT OR REPLACE INTO trips (name, num_students) VALUES (?, ?)')
    .run(name, num_students)
}
