CREATE TABLE temp (
	coordinates TEXT,
	name TEXT NOT NULL UNIQUE,
	address TEXT,
	special_instructions TEXT
);

.import --csv --skip 1 ./db/stops.csv temp

UPDATE temp
SET coordinates = NULL
WHERE coordinates = "";

INSERT OR REPLACE INTO stops
SELECT coordinates, trim(name) as name, address, special_instructions
FROM temp
WHERE TRUE -- Required for the UPSERT clause that follows
ON CONFLICT (name) DO UPDATE SET
	coordinates=excluded.coordinates,
	address=excluded.address,
	special_instructions=excluded.special_instructions;

DROP TABLE temp;
