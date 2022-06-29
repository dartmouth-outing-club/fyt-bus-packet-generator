#!/bin/bash
#Run this from the root directory, via `npm run init`
set -e
DB_FILENAME="packet-generator.db"
CSV_FILENAME="stops.csv"

if [[ -f $DB_FILENAME ]]
then
	echo "Error - $DB_FILENAME already exists"
	exit 1
fi

echo "Creating $DB_FILENAME from $CSV_FILENAME"
sqlite3 $DB_FILENAME << EOF
.read ./scripts/db-schema.sql
.import --csv --skip 1 ./scripts/$CSV_FILENAME stops
EOF

# set -e ensures we only see this if sqlite3 exited successfully
echo 'Import completed successfully'
exit 0
