// JSON file ka saara data Neon database mai likhne ki script
// Chalane ka tareeqa (project folder se):
//   node --env-file=.env.local scripts/import-to-neon.mjs

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL nahi mili. .env.local file check karein.");
}

const sql = neon(process.env.DATABASE_URL);

// 1. JSON file padhein
const file = await readFile("data/telenor_200_customers.json", "utf-8");
const { customers } = JSON.parse(file);
console.log(`JSON mai ${customers.length} customers mile.`);

// 2. Table banayein (agar pehle se hai to kuch nahi hoga)
await sql`
  CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    gender TEXT,
    age INT,
    city TEXT NOT NULL,
    province TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    package_id TEXT,
    connection_type TEXT,
    join_date DATE,
    monthly_spend_pkr INT,
    monthly_data_usage_gb NUMERIC(6,1),
    status TEXT
  )
`;

// 3. Saara data ek hi query se database mai likhein
//    (customer_id pehle se ho to dobara nahi likhta)
await sql`
  INSERT INTO customers
  SELECT * FROM jsonb_populate_recordset(NULL::customers, ${JSON.stringify(customers)}::jsonb)
  ON CONFLICT (customer_id) DO NOTHING
`;

// 4. Check karein
const result = await sql`SELECT COUNT(*)::int AS total FROM customers`;
console.log(`Database mai ab total customers: ${result[0].total}`);