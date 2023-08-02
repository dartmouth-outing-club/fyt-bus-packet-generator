import fs from 'node:fs'
import Database from 'better-sqlite3'

let db

export function start (name) {
  if (db !== undefined) throw new Error('ERROR: tried to start sqlite db that was already running')

  const dbName = name || ':memory:'
  try {
    db = new Database(dbName, { fileMustExist: true })
  } catch (error) {
    console.error(`Failed to open the database at ${name}`)
    throw new Error(error)
  }
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  console.log(`Starting sqlite database from file: ${getDatabaseFile()}`)
}

export const getDatabaseFile = () => db.pragma('database_list')[0].file

export function stop () {
  db.close()
  db = undefined
}

export function execFile (filePath) {
  const statements = fs.readFileSync(filePath).toString()
  return db.exec(statements)
}

export function getAllStops () {
  return db.prepare('SELECT name FROM stops').all()
}

export function getAllStopsWithStats () {
  const statement = `
SELECT stops.name, IFNULL(packets_present, 0) as packets_present
FROM stops
LEFT JOIN (
  SELECT stop as name, count(stop) as packets_present
  FROM packet_stops
  GROUP BY stop
) as packet_counts ON packet_counts.name = stops.name
`
  return db.prepare(statement).all()
}

export function getStop (name) {
  const stop = db.prepare(`
  SELECT name, special_instructions, coordinates, address
  FROM stops
  WHERE name = ?`).get(name)
  return stop
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

export function getPacket (id) {
  return db.prepare('SELECT id, name, query, html_content FROM packets WHERE id = ?').get(id)
}

export function getAllPackets () {
  return db.prepare('SELECT id, name, query FROM packets').all()
}

export function getAllPacketsWithStats () {
  return db.prepare(`
  SELECT
    packets.id,
    packets.name,
    coalesce(sum(num_students), 0) as total_students
  FROM packets
  LEFT JOIN packet_trips ON packets.id = packet_trips.packet
  LEFT JOIN trips ON trips.name = packet_trips.trip
  GROUP BY packet
  `).all()
}

export function getAllPacketNames () {
  return db.prepare('SELECT name FROM packets').all().map(row => row.name)
}

export function savePacket (name, query, html, trips, stops, id) {
  let packetId = id

  if (id) {
    db.prepare(`
      INSERT INTO packets (id, name, query, html_content)
      VALUES (?, ?, ?, ?)
    `).run(id, name, query, html)
  } else {
    const info = db.prepare(`
      INSERT INTO packets (name, query, html_content)
      VALUES (?, ?, ?)
    `).run(name, query, html)
    packetId = info.lastInsertRowid
  }

  trips.forEach(trip => {
    db
      .prepare('INSERT INTO packet_trips (packet, trip) VALUES (?, ?)')
      .run(packetId, trip.name)
  })

  stops.forEach(stop => {
    db
      .prepare('INSERT INTO packet_stops (packet, stop) VALUES (?, ?)')
      .run(packetId, stop)
  })
}

export function deletePacket (id) {
  const { changes } = db.prepare('DELETE FROM packets WHERE id = ?').run(id)
  console.log(`Deleted ${changes} packet(s)`)
  return changes
}

export function getTrip (name) {
  return db.prepare('SELECT name, num_students FROM trips where name = ?').get(name)
}

export function getAllTrips () {
  return db.prepare('SELECT name, num_students FROM trips').all()
}

export function getAllTripsWithStats () {
  const statement = `
    SELECT
      trips.name,
      num_students,
      count(packet) as num_packets,
      IFNULL(group_concat(packet, ', '), '(none)') as packets_present
    FROM trips
    LEFT JOIN packet_trips ON trips.name = trip
    GROUP BY trips.name
`

  return db.prepare(statement).all()
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

export function getAllLegs () {
  const statement = `
SELECT start_names.name AS start_name, end_names.name AS end_name, google_directions
FROM directions
LEFT JOIN stops AS start_names ON start_coordinates=start_names.coordinates
LEFT JOIN stops AS end_names ON end_coordinates=end_names.coordinates
WHERE start_name IS NOT NULL
  AND end_name IS NOT NULL;
`

  const legs = db.prepare(statement).all()
  return legs.map((leg) => {
    return { ...leg, directions: JSON.parse(leg.google_directions) }
  })
}
