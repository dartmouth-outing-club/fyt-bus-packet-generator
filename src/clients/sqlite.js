import Database from 'better-sqlite3'

const db = new Database('./packet-generator.db')
// db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function getStops () {
  return db.prepare('SELECT name FROM stops').all().map(row => row.name)
}

export function getStopByCoordinates (name) {
  const stop = db.prepare('SELECT name, special_instructions FROM stops WHERE name = ?').get(name)
  return {
    name: stop.name,
    specialInstructions: stop.specialInstructions
  }

}

export function getCoordinatesByStopName (name) {
  return db.prepare('SELECT coordinates FROM stops WHERE name = ?').get(name)?.coordinates
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

export function saveDirections (start, end, directions) {
  db.prepare(`
  INSERT INTO directions (start_coordinates, end_coordinates, google_directions)
  VALUES (?, ?, ?)
  `).run(start, end, directions)
}

export function getPacket (name) {
  return db.prepare('SELECT html_content FROM packets WHERE name = ?').get(name)?.html_content
}

export function getAllPacketNames () {
  return db.prepare('SELECT name FROM packets').all().map(row => row.name)
}

export function savePacket (name, html) {
  db.prepare(`
  INSERT INTO packets (name, html_content)
  VALUES (?, ?)
  `).run(name, html)
}
