#!/bin/bash
#Run this from the root directory
set -e

sqlite3 packet-generator.db << EOF
.read ./scripts/db-schema.sql
.import --csv --skip 1 ./scripts/stops.csv stops
EOF

