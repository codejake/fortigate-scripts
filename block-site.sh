#!/bin/bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd "$script_dir"

echo ""

bun run set-local-override-for-domain.ts "$1" "141" "blocked"

echo ""
echo "Confirming entry:"
echo ""

bun run get-local-override-for-domain.ts "$1"

echo ""
