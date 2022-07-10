#!/bin/bash
#Run this from the root directory, via `npm run init`
set -e
DB_FILENAME="packet-generator.db"
STOPS_CSV="stops.csv"
TRIPS_CSV="trips.csv"

if [[ -f $DB_FILENAME ]]
then
	echo "Error - $DB_FILENAME already exists"
	exit 1
fi

SQLITE_VERSION=$(sqlite3 --version | cut -d ' ' -f 1)
SQLITE3_MINOR_VERSION=$(echo $SQLITE_VERSION | cut -d '.' -f 2)
if [[ $SQLITE3_MINOR_VERSION -lt 38 ]]
then
	echo "Error - script requires a newer version of the sqlite3 CLI"
	echo "Required: >3.38.x, Current: $SQLITE_VERSION"
	exit 1
fi


echo "Creating $DB_FILENAME"
sqlite3 $DB_FILENAME << EOF
.read ./scripts/db-schema.sql
.import --csv --skip 1 ./scripts/$STOPS_CSV stops
.import --csv --skip 1 ./scripts/$TRIPS_CSV trips
EOF

# set -e ensures we only see this if sqlite3 exited successfully
echo 'Import completed successfully'
exit 0
