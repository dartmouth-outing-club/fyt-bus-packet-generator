#!/bin/bash
#
# Name: init-db.sh
# Author: Alexander Petros
#
# Run this from the root directory, via `npm run init`

set -e
DB_FILENAME="packet-generator.db"
DB_SCHEMA_FP="./db/db-schema.sql"
STOPS_CSV_FP="./db/stops.csv"
TRIPS_CSV_FP="./db/trips.csv"

if [[ ! -f $DB_SCHEMA_FP ]]
then
	echo "Could not find database schema"
	echo "Make sure to run this script via 'npm run init', not directly in the command line."

	exit 1
fi

if [[ -f $DB_FILENAME ]]
then
	echo "Error - $DB_FILENAME already exists"
	exit 1
fi

SQLITE_VERSION=$(sqlite3 --version | cut -d ' ' -f 1)
SQLITE3_MINOR_VERSION=$(echo $SQLITE_VERSION | cut -d '.' -f 2)
if [[ $SQLITE3_MINOR_VERSION -lt 35 ]]
then
	echo "Error - script requires a newer version of the sqlite3 CLI"
	echo "Required: >3.35.x, Current: $SQLITE_VERSION"
	exit 1
fi


echo "Creating $DB_FILENAME"
sqlite3 $DB_FILENAME << EOF
.read $DB_SCHEMA_FP
.import --csv --skip 1 $STOPS_CSV_FP stops
.import --csv --skip 1 $TRIPS_CSV_FP trips
EOF

# set -e ensures we only see this if sqlite3 exited successfully
echo 'Import completed successfully'
exit 0
