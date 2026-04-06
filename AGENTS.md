## Script Instructions

Use one section per script. Keep each section short, explicit, and focused on behavior.

Recommended section shape:

- Purpose: what the script does.
- Input: what arguments or env vars it accepts.
- Request/Behavior: what it must do.
- Output: what it should print or return.
- Notes: style or implementation constraints.

## `get-fortigate-ratings-for-domain.ts`

Purpose:

- Look up the FortiGate web-filter rating for a provided domain or URL.

Input:

- Accept a single command-line argument.
- The argument may be either a full URL or a bare domain.
- Parse the argument into an FQDN/hostname before making the request.
- Read `FORTIGATE_TOKEN` from `.env`.

Request/Behavior:

- Build this script in TypeScript and keep it extremely minimal.
- Send a `POST` request to:
  `https://fortigate.foo.com/api/v2/monitor/utm/rating-lookup/select`
- Use Bearer token authentication.
- Send this JSON body:

```json
{
  "url": "<parsed FQDN>"
}
```

Output:

- Read `results.url`, `results.category`, and `results.subcategory` from the API response.
- Print only those values in the script output.
- The script should print the resolved URL, category, and subcategory in a simple readable format.

Reference response shape:

```json
{
  "http_method": "POST",
  "results": {
    "url": "playboy.com",
    "category": "Adult/Mature Content",
    "subcategory": "Pornography"
  },
  "vdom": "root",
  "path": "utm",
  "name": "rating-lookup",
  "action": "select",
  "status": "success",
  "serial": "FG22E1T919900497",
  "version": "v7.6.6",
  "build": 3652
}
```

Notes:

- Minimize custom type declarations.
- Add comments only where they improve readability.
- Prefer straightforward parsing and simple output over abstraction.

## `get-local-override-for-domain.ts`

Purpose:

- Look up the FortiGate local web-filter override for a provided domain or URL.

Input:

- Accept a single command-line argument.
- The argument may be either a full URL or a bare domain.
- Parse the argument into an FQDN/hostname before making the request.
- Read `FORTIGATE_TOKEN` from `.env`.

Request/Behavior:

- Build this script in TypeScript and keep it extremely minimal.
- Send a `GET` request to:
  `https://fortigate.foo.com/api/v2/cmdb/webfilter/ftgd-local-rating/<parsed FQDN>`
- Use Bearer token authentication.
- Treat HTTP `404` from that endpoint as "no local override".
- If a local override exists, read `results[0].url`, `results[0].status`, and `results[0].rating`.
- Resolve the rating ID by first requesting:
  `https://fortigate.foo.com/api/v2/cmdb/webfilter/ftgd-local-cat`
- Match the override rating against `results[].id` and read the category label from `results[].desc`.
- If the category is still unknown, make an additional `GET` request to:
  `https://fortigate.foo.com/api/v2/monitor/webfilter/fortiguard-categories`
- Match the same rating against `results[].id` there and read the category label from `results[].name`.

Output:

- If there is no local override, print a simple message indicating none exists for the resolved URL.
- If a local override exists, print only the resolved URL, override status, and resolved category in a simple readable format.
- Do not print the raw numeric rating to the end user unless no category label can be found from either category endpoint.

Notes:

- Minimize custom type declarations.
- Add comments only where they improve readability.
- Prefer straightforward parsing and simple output over abstraction.
