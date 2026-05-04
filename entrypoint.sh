#!/bin/sh
set -e

PUID="${PUID:-1000}"
PGID="${PGID:-1000}"
DATA_DIR="${DATA_DIR:-/data}"

# Create/resolve group for PGID
if getent group "$PGID" > /dev/null 2>&1; then
  RUN_GROUP=$(getent group "$PGID" | cut -d: -f1)
else
  groupadd -g "$PGID" cauldron
  RUN_GROUP="cauldron"
fi

# Create/resolve user for PUID
if getent passwd "$PUID" > /dev/null 2>&1; then
  RUN_USER=$(getent passwd "$PUID" | cut -d: -f1)
else
  useradd -u "$PUID" -g "$RUN_GROUP" -M -N cauldron
  RUN_USER="cauldron"
fi

mkdir -p "${DATA_DIR}" "${DATA_DIR}/uploads"
chown -R "$PUID:$PGID" "${DATA_DIR}"

# Generate JWT secret on first run if not provided
if [ ! -f "${DATA_DIR}/jwt_secret" ] && [ -z "${JWT_SECRET}" ]; then
  head -c 48 /dev/urandom | base64 > "${DATA_DIR}/jwt_secret"
  chown "${PUID}:${PGID}" "${DATA_DIR}/jwt_secret"
  chmod 600 "${DATA_DIR}/jwt_secret"
  echo "=== Cauldron: Generated JWT secret ==="
fi

echo "=== Cauldron: Starting server ==="

exec gosu "${RUN_USER}" node /app/dist/index.js
