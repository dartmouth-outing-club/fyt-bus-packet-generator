CREATE TABLE temp (
	coordinates TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	address TEXT,
	special_instructions TEXT
);

.import --csv --skip 1 ./db/stops.csv temp

INSERT OR REPLACE INTO stops
SELECT coordinates, name, address, special_instructions
FROM temp
WHERE TRUE -- Required for the UPSERT clause that follows
ON CONFLICT (name) DO UPDATE SET
	coordinates=excluded.coordinates,
	address=excluded.address,
	special_instructions=excluded.special_instructions;

DROP TABLE temp;
