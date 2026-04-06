#!/usr/bin/env bun run

const input = process.argv[2];

if (!input) {
  console.error("Usage: bun run get-fortigate-ratings-for-domain.ts <url-or-domain>");
  process.exit(1);
}

const firewall = Bun.env.FORTIGATE_HOST;
const token = Bun.env.FORTIGATE_TOKEN;

if (!firewall) {
  console.error("Missing FORTIGATE_HOST in .env");
  process.exit(1);
}

if (!token) {
  console.error("Missing FORTIGATE_TOKEN in .env");
  process.exit(1);
}

const useColor = Boolean(process.stdout.isTTY && !Bun.env.NO_COLOR);

const color = (code: number, value: string) =>
  useColor ? `\u001b[${code}m${value}\u001b[0m` : value;

const bold = (value: string) => color(1, value);
const cyan = (value: string) => color(36, value);
const dim = (value: string) => color(90, value);
const yellow = (value: string) => color(33, value);
const magenta = (value: string) => color(35, value);
const red = (value: string) => color(31, value);

const formatCategory = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return yellow("Unknown");

  const text = value.toLowerCase();

  if (
    text.includes("security risk") ||
    text.includes("malicious") ||
    text.includes("phishing") ||
    text.includes("spam") ||
    text.includes("newly registered")
  ) {
    return red(value);
  }

  if (text.includes("adult") || text.includes("porn") || text.includes("nudity")) {
    return magenta(value);
  }

  if (text.includes("unrated") || text.includes("unknown")) {
    return yellow(value);
  }

  return cyan(value);
};

// Accept either a bare domain or a full URL.
const parseFqdn = (value: string) => {
  const source = value.includes("://") ? value : `https://${value}`;
  const hostname = new URL(source).hostname.replace(/\.$/, "").toLowerCase();

  if (!hostname) throw new Error("Could not parse a domain from the argument");

  return hostname;
};

try {
  const url = parseFqdn(input);
  const response = await fetch(
    `https://${firewall}/api/v2/monitor/utm/rating-lookup/select`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ url }),
    },
  );

  if (!response.ok) {
    console.error(red(`Request failed: ${response.status} ${response.statusText}`));
    process.exit(1);
  }

  const data: any = await response.json();
  const result = data?.results;

  if (!result) {
    console.error(red("Response did not include results"));
    process.exit(1);
  }

  console.log(`${bold("Fortiguard rating for")} ${cyan(result.url ?? url)}\n`);
  console.log(`${dim("category:")} ${formatCategory(result.category)}`);
  console.log(`${dim("subcategory:")} ${formatCategory(result.subcategory)}\n`);
} catch (error) {
  console.error(red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
}
