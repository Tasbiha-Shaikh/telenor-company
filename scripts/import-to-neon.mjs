// Import all JSON data into the Neon database.
// Run from the project directory:
//   node --env-file=.env.local scripts/import-to-neon.mjs

import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Check your .env.local file.");
}

const sql = neon(process.env.DATABASE_URL);

// 1. Read the JSON file.
const file = await readFile("data/telenor_200_customers.json", "utf-8");
const { customers } = JSON.parse(file);
console.log(`Found ${customers.length} customers in the JSON file.`);

// 2. Create the table if it does not already exist.
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

// 3. Insert all data in one query.
//    Existing customer IDs are skipped.
await sql`
  INSERT INTO customers
  SELECT * FROM jsonb_populate_recordset(NULL::customers, ${JSON.stringify(customers)}::jsonb)
  ON CONFLICT (customer_id) DO NOTHING
`;

// 4. Verify the total.
const result = await sql`SELECT COUNT(*)::int AS total FROM customers`;
console.log(`The database now contains ${result[0].total} customers.`);