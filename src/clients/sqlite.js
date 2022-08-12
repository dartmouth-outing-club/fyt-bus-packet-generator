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
    console.log(`Cache hit for directions from ${origin} to ${destination}`)
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

export function getAllPackets () {
  return db.prepare('SELECT name, query FROM packets').all()
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
  console.log(`Inserting ${name} (${num_students} students)`)
  const statement = `
INSERT INTO trips (name, num_students) VALUES (?, ?)
  ON CONFLICT (name) DO UPDATE SET num_students=excluded.num_students
`
  return db
    .prepare(statement)
    .run(name, num_students)
}

export function deleteTrip (name) {
  const { changes } = db.prepare('DELETE FROM trips WHERE name = ?').run(name)
  console.log(`Deleted ${changes} trip(s)`)
  return changes
}

export function savePacketTrips (packetTitle, trips) {
  trips.forEach(trip => {
    db
      .prepare('INSERT OR REPLACE INTO packet_trips (packet, trip) VALUES (?, ?)')
      .run(packetTitle, trip.name)
  })
}

export function getAllLegs () {
  const statement = `
SELECT start_names.name AS start_name, end_names.name AS end_name, google_directions
FROM directions
LEFT JOIN stops AS start_names ON start_coordinates=start_names.coordinates
LEFT JOIN stops AS end_names ON end_coordinates=end_names.coordinates`

  const legs = db.prepare(statement).all()
  return legs.map((leg) => ({
    ...leg,
    directions: JSON.parse(leg.google_directions)
  }))
}
