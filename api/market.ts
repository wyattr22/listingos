import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./_lib/prisma.js";
import { json, methodNotAllowed } from "./_lib/http.js";

async function getRedfinData(zip: string) {
  const latest = await prisma.redfinMarketData.findFirst({
    where: { zipCode: zip },
    orderBy: { periodBegin: "desc" },
  });
  if (!latest) return null;

  const trend = await prisma.redfinMarketData.findMany({
    where: { zipCode: zip },
    orderBy: { periodBegin: "desc" },
    take: 12,
    select: { periodBegin: true, medianSalePrice: true, medianDom: true, inventory: true, avgSaleToList: true },
  });

  return { latest, trend: trend.reverse() };
}

async function getCensusData(zip: string, apiKey: string) {
  const vars = ["B19013_001E", "B01003_001E", "B25077_001E", "B25064_001E"].join(",");
  const url = `https://api.census.gov/data/2022/acs/acs5?get=${vars}&for=zip%20code%20tabulation%20area:${zip}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json() as string[][];
  if (!data || data.length < 2) return null;
  const [headers, values] = data;
  const r = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  const toNum = (v: string) => { const n = parseInt(v); return n < 0 ? null : n; };
  return {
    medianHouseholdIncome: toNum(r["B19013_001E"]),
    population: toNum(r["B01003_001E"]),
    medianHomeValue: toNum(r["B25077_001E"]),
    medianGrossRent: toNum(r["B25064_001E"]),
    source: "US Census ACS 5-Year 2022",
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return methodNotAllowed(res);

  const zip = String(req.query.zip || "").replace(/\D/g, "").slice(0, 5);
  if (zip.length !== 5) return json(res, 400, { error: "Invalid zip code" });

  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=3600");

  const [redfin, census] = await Promise.all([
    getRedfinData(zip),
    process.env.CENSUS_API_KEY ? getCensusData(zip, process.env.CENSUS_API_KEY) : Promise.resolve(null),
  ]);

  if (!redfin && !census) return json(res, 404, { error: "No market data for this zip code" });

  return json(res, 200, { zip, redfin, census });
}
