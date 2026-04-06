#!/bin/bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

cd "$script_dir"

echo ""

bun run get-fortigate-ratings-for-domain.ts "$1"

echo ""

bun run get-local-override-for-domain.ts "$1"

echo ""
