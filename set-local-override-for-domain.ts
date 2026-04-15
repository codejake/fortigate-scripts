#!/usr/bin/env bun run

const input = process.argv[2];
const categoryId = process.argv[3];
const comment = process.argv[4]

if (!input || !categoryId || !comment) {
    console.error(
        'Usage: bun run set-local-override-for-domain.ts "<url-or-domain>" "<category-id>" "<comment>"',
    );
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
const green = (value: string) => color(32, value);
const red = (value: string) => color(31, value);

const parseFqdn = (value: string) => {
    const source = value.includes("://") ? value : `https://${value}`;
    const hostname = new URL(source).hostname.replace(/\.$/, "").toLowerCase();

    if (!hostname) throw new Error("Could not parse a domain from the argument");

    return hostname;
};

try {
    const today = new Date().toISOString().slice(0, 10);
    const url = parseFqdn(input);
    const response = await fetch(
        `https://${firewall}/api/v2/cmdb/webfilter/ftgd-local-rating`,
        {
            method: "POST",
            headers: {
                authorization: `Bearer ${token}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                url,
                status: "enable",
                comment: `${today} Added by set-local-override-for-domain.ts: ${comment}`,
                rating: categoryId,
            }),
        },
    );

    if (!response.ok) {
        console.error(red(`Request failed: ${response.status} ${response.statusText}`));
        process.exit(1);
    }

    // console.log(response.status);

    const data: any = await response.json();
    const result = data?.status;

    if (!result) {
        console.error(red("Response did not include results"));
        process.exit(1);
    }

    console.log(`${bold("Set local override for")} ${cyan(result.url ?? url)}\n`);
    console.log(`${dim("status:")} ${green(result.status ?? "enable")}`);
    console.log(`${dim("category id:")} ${result.rating ?? categoryId}\n`);
} catch (error) {
    console.error(red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
}
