CREATE TABLE directions (
	id INTEGER PRIMARY KEY,
	start_coordinates TEXT REFERENCES stops ON UPDATE SET NULL,
	end_coordinates TEXT REFERENCES stops ON UPDATE SET NULL,
	google_directions TEXT,
	updated_at INTEGER
) STRICT;

CREATE TABLE packets (
	id INTEGER PRIMARY KEY,
	name TEXT,
	query TEXT,
	html_content TEXT,
	updated_at INTEGER
) STRICT;

CREATE TABLE stops (
	coordinates TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	address TEXT,
	special_instructions TEXT
) STRICT;

CREATE TABLE trips (
	name TEXT PRIMARY KEY,
	num_students INTEGER
) STRICT;

-- Associate packets with trips so that we know what buses a trip is on.
-- The delete restriction on the trip makes it impossible to delete a trip from
-- the trips table if that trip has a packet associated with it.
CREATE TABLE packet_trips (
	packet INTEGER NOT NULL REFERENCES packets ON DELETE CASCADE ON UPDATE CASCADE,
	trip TEXT REFERENCES trips ON DELETE RESTRICT ON UPDATE CASCADE
) STRICT;

CREATE TABLE packet_stops (
	packet INTEGER NOT NULL REFERENCES packets ON DELETE CASCADE ON UPDATE CASCADE,
	stop TEXT REFERENCES stops(name) ON DELETE RESTRICT ON UPDATE CASCADE
) STRICT;

CREATE TRIGGER directions_inserted AFTER INSERT ON directions
BEGIN
	UPDATE directions SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER directions_updated AFTER UPDATE ON directions
BEGIN
	UPDATE directions SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER packets_inserted AFTER INSERT ON packets
BEGIN
	UPDATE packets SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER packets_updated AFTER UPDATE ON packets
BEGIN
	UPDATE packets SET updated_at = unixepoch() WHERE id = NEW.id;
END;
