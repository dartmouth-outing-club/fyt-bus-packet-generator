CREATE TABLE stops (
	coordinates TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	address TEXT,
	special_instructions TEXT
);

CREATE TABLE directions (
	id INTEGER PRIMARY KEY,
	start_coordinates TEXT REFERENCES stops ON UPDATE SET NULL,
	end_coordinates TEXT REFERENCES stops ON UPDATE SET NULL,
	google_directions TEXT,
	updated_at INTEGER
);

CREATE TABLE packets (
	name TEXT PRIMARY KEY,
	html_content TEXT,
	updated_at INTEGER
);


CREATE TRIGGER directions_updated AFTER UPDATE ON directions
BEGIN
	UPDATE directions SET updated_at = unixepoch() WHERE id = NEW.id;
END;

CREATE TRIGGER packets_updated AFTER UPDATE ON directions
BEGIN
	UPDATE packets SET updated_at = unixepoch() WHERE name = NEW.name;
END;
