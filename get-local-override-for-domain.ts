#!/usr/bin/env bun run

const input = process.argv[2];
const useColor = Boolean(process.stdout.isTTY && !Bun.env.NO_COLOR);

const color = (code: number, value: string) =>
    useColor ? `\u001b[${code}m${value}\u001b[0m` : value;

const bold = (value: string) => color(1, value);
const cyan = (value: string) => color(36, value);
const dim = (value: string) => color(90, value);
const green = (value: string) => color(32, value);
const yellow = (value: string) => color(33, value);
const red = (value: string) => color(31, value);

const colorCategory = (value: string) => {
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

    if (text.includes("unrated") || text.includes("unknown")) {
        return yellow(value);
    }

    return cyan(value);
};

const colorStatus = (value: string) => {
    const text = value.toLowerCase();

    if (text === "enable" || text === "enabled") return green(value);
    if (text === "disable" || text === "disabled") return yellow(value);

    return value;
};

if (!input) {
    console.error("Usage: bun run get-local-override-for-domain.ts <url-or-domain>");
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

const parseFqdn = (value: string) => {
    const source = value.includes("://") ? value : `https://${value}`;
    const hostname = new URL(source).hostname.replace(/\.$/, "").toLowerCase();

    if (!hostname) throw new Error("Could not parse a domain from the argument");

    return hostname;
};

const findCategoryLabel = (results: any, rating: string) =>
    results?.find?.((entry: any) => String(entry?.id) === String(rating))?.desc ??
    results?.find?.((entry: any) => String(entry?.id) === String(rating))?.name;

try {
    const url = parseFqdn(input);
    const headers = { authorization: `Bearer ${token}` };

    const overrideResponse = await fetch(
        `https://${firewall}/api/v2/cmdb/webfilter/ftgd-local-rating/${url}`,
        { headers },
    );

    if (overrideResponse.status === 404) {
        console.log(`${bold("Local override for")} ${cyan(url)}: ${yellow("none")}`);
        process.exit(0);
    }

    if (!overrideResponse.ok) {
        console.error(
            red(`Request failed: ${overrideResponse.status} ${overrideResponse.statusText}`),
        );
        process.exit(1);
    }

    const overrideData: any = await overrideResponse.json();
    const override = overrideData?.results?.[0];

    if (!override) {
        console.error(red("Response did not include a local override result"));
        process.exit(1);
    }

    const categoriesResponse = await fetch(
        "https://${firewall}/api/v2/cmdb/webfilter/ftgd-local-cat",
        { headers },
    );

    if (!categoriesResponse.ok) {
        console.error(
            red(`Request failed: ${categoriesResponse.status} ${categoriesResponse.statusText}`),
        );
        process.exit(1);
    }

    const categoriesData: any = await categoriesResponse.json();
    let category = findCategoryLabel(categoriesData?.results, override.rating);

    if (!category) {
        const fortiguardCategoriesResponse = await fetch(
            "https://${firewall}/api/v2/monitor/webfilter/fortiguard-categories",
            { headers },
        );

        if (!fortiguardCategoriesResponse.ok) {
            console.error(
                red(
                    `Request failed: ${fortiguardCategoriesResponse.status} ${fortiguardCategoriesResponse.statusText}`,
                ),
            );
            process.exit(1);
        }

        const fortiguardCategoriesData: any =
            await fortiguardCategoriesResponse.json();
        category = findCategoryLabel(
            fortiguardCategoriesData?.results,
            override.rating,
        );
    }

    console.log(`${bold("Local override for")} ${cyan(override.url ?? url)}\n`);
    console.log(`${dim("status:")} ${colorStatus(override.status)}`);
    console.log(
        `${dim("category:")} ${colorCategory(category ?? `Unknown (${override.rating})`)}\n`,
    );
} catch (error) {
    console.error(red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
}
