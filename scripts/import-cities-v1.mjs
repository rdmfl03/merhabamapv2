import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV ist leer oder enthält keine Datensätze.");
  }

  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line, index) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};

    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });

    row.__line = index + 2;
    return row;
  });
}

function normalizeNullableString(value) {
  if (value === undefined || value === null) return null;
  const v = String(value).trim();
  return v === "" ? null : v;
}

function normalizeFloat(value) {
  const v = normalizeNullableString(value);
  if (!v) return null;
  const parsed = Number(v.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeAgs(value) {
  const v = normalizeNullableString(value);
  if (!v) return null;
  return v.replace(/\s+/g, "");
}

async function upsertCity(row) {
  const nameDe = normalizeNullableString(row.name_de);
  if (!nameDe) {
    throw new Error(`Zeile ${row.__line}: name_de fehlt.`);
  }

  const slug = slugify(nameDe);
  const stateCode = normalizeNullableString(row.state_code);
  const ags = normalizeAgs(row.ags);
  const lat = normalizeFloat(row.lat);
  const lng = normalizeFloat(row.lng);

  const result = await prisma.$queryRaw`
    SELECT id, slug, is_pilot, ags
    FROM cities
    WHERE slug = ${slug}
    LIMIT 1
  `;

  if (result.length > 0) {
    await prisma.$executeRaw`
      UPDATE cities
      SET
        name_de = ${nameDe},
        name_tr = ${nameDe},
        country_code = 'DE',
        state_code = ${stateCode},
        ags = COALESCE(${ags}, ags),
        lat = ${lat},
        lng = ${lng},
        source = 'destatis-import-v1',
        source_updated_at = NOW(),
        is_pilot = CASE
          WHEN is_pilot = true THEN true
          ELSE false
        END
      WHERE slug = ${slug}
    `;

    return "updated";
  }

  if (ags) {
    const byAgs = await prisma.$queryRaw`
      SELECT id, slug, is_pilot
      FROM cities
      WHERE ags = ${ags}
      LIMIT 1
    `;

    if (byAgs.length > 0) {
      const existing = byAgs[0];

      await prisma.$executeRaw`
        UPDATE cities
        SET
          slug = ${slug},
          name_de = ${nameDe},
          name_tr = ${nameDe},
          country_code = 'DE',
          state_code = ${stateCode},
          ags = ${ags},
          lat = ${lat},
          lng = ${lng},
          source = 'destatis-import-v1',
          source_updated_at = NOW(),
          is_pilot = CASE
            WHEN is_pilot = true THEN true
            ELSE false
          END
        WHERE id = ${existing.id}
      `;

      return "updated";
    }
  }

  const idResult = await prisma.$queryRaw`SELECT gen_random_uuid()::text AS id`;
  const newId = idResult[0].id;

  await prisma.$executeRaw`
    INSERT INTO cities (
      id,
      slug,
      name_de,
      name_tr,
      country_code,
      is_pilot,
      state_code,
      ags,
      lat,
      lng,
      source,
      source_updated_at
    )
    VALUES (
      ${newId},
      ${slug},
      ${nameDe},
      ${nameDe},
      'DE',
      false,
      ${stateCode},
      ${ags},
      ${lat},
      ${lng},
      'destatis-import-v1',
      NOW()
    )
  `;

  return "created";
}

async function main() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    throw new Error(
      "Bitte Pfad zur CSV angeben, z. B. node scripts/import-cities-v1.mjs data/cities_de.csv"
    );
  }

  const filePath = path.resolve(process.cwd(), fileArg);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Datei nicht gefunden: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(content);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const status = await upsertCity(row);
      if (status === "created") created += 1;
      if (status === "updated") updated += 1;
    } catch (error) {
      failed += 1;
      console.error(`Fehler in Zeile ${row.__line}:`, error.message);
    }
  }

  const totalResult = await prisma.$queryRaw`SELECT COUNT(*)::int AS count FROM cities`;
  const total = totalResult[0].count;

  console.log("Import abgeschlossen.");
  console.log(`Neu erstellt: ${created}`);
  console.log(`Aktualisiert: ${updated}`);
  console.log(`Fehler: ${failed}`);
  console.log(`Cities gesamt in DB: ${total}`);
}

main()
  .catch((error) => {
    console.error("Import fehlgeschlagen:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });