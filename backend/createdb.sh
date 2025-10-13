#!/bin/bash

echo "Creating database..."
createdb -U postgres staffany 2>/dev/null || echo "Database may already exist"

echo "Granting privileges..."
psql -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE staffany TO postgres;"

echo "Database and user created successfully."