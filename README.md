# fortigate-scripts

Small Bun scripts for doing stuff with a FortiGate firewall.

## Requirements

- [Bun](https://bun.com)
- A `.env` file in this repo with:

```env
FORTIGATE_TOKEN=your-api-token
FORTIGATE_HOST=fortigate.foo.com
```

`FORTIGATE_HOST` and `FORTIGATE_TOKEN` is required by both scripts.

## Install

```bash
bun install
```

## `get-fortigate-ratings-for-domain.ts`

Looks up the FortiGuard rating for a domain or URL.

Run it with either a bare domain or a full URL:

```bash
bun run get-fortigate-ratings-for-domain.ts "urlpush.net"
```

```bash
bun run get-fortigate-ratings-for-domain.ts "https://urlpush.net/some/path"
```

Example output:

```text
Fortiguard rating for urlpush.net

category: Security Risk
subcategory: Malicious Websites
```

## `get-local-override-for-domain.ts`

Looks up the FortiGate local override for a domain or URL.

Run it with either a bare domain or a full URL:

```bash
bun run get-local-override-for-domain.ts "urlpush.net"
```

```bash
bun run get-local-override-for-domain.ts "https://urlpush.net/some/path"
```

If a local override exists, the script prints the resolved URL, override status, and category:

```text
Local override for urlpush.net

status: enable
category: Malicious Websites
```

If no local override exists, it prints:

```text
Local override for example.com: none
```

## Notes

- Both scripts normalize the input to a hostname before making API requests.
- Output is colorized in an interactive terminal.
- Set `NO_COLOR=1` to disable ANSI colors.
