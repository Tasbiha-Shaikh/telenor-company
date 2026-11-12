import { NextResponse } from "next/server";
import { getSql, normalize, num, str, dbError } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
const VALID_STATUS = new Set(["active", "inactive", "suspended"]);

function parseStatus(value) {
  if (value === undefined || value === null || value === "") return { value: null, invalid: false };
  const normalized = String(value).trim().toLowerCase();
  if (!VALID_STATUS.has(normalized)) return { value: null, invalid: true };
  return { value: normalized, invalid: false };
}

// GET /api/customers  ->  saaray customers
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const sql = getSql();
    const rows = await sql`SELECT * FROM customers ORDER BY customer_id`;
    return NextResponse.json(rows.map(normalize));
  } catch (err) {
    return NextResponse.json(dbError("Database se data nahi mila", err), { status: 500 });
  }
}

// POST /api/customers  ->  naya customer database mai likhna
export async function POST(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const b = await request.json();
    if (!str(b.name) || !str(b.city) || !str(b.phone)) {
      return NextResponse.json({ error: "name, city and phone are required" }, { status: 400 });
    }

    const age = num(b.age) ?? 18;
    const spend = num(b.monthly_spend_pkr) ?? 0;
    const usage = num(b.monthly_data_usage_gb) ?? 0;
    if ([age, spend, usage].some(Number.isNaN)) {
      return NextResponse.json({ error: "age, spend and usage must be numbers" }, { status: 400 });
    }
    const status = parseStatus(b.status);
    if (status.invalid) {
      return NextResponse.json({ error: "status must be active, inactive or suspended" }, { status: 400 });
    }

    const sql = getSql();
    // customer_id database khud banati hai (C1201, C1202, ...)
    const rows = await sql`
      INSERT INTO customers
        (customer_id, name, gender, age, city, province, phone, email,
         package_id, connection_type, join_date, monthly_spend_pkr,
         monthly_data_usage_gb, status)
      VALUES
        ((SELECT 'C' || (COALESCE(MAX(SUBSTRING(customer_id FROM 2)::INT), 1000) + 1) FROM customers),
         ${str(b.name)}, ${str(b.gender) ?? "Male"}, ${age}, ${str(b.city)},
         ${str(b.province) ?? ""}, ${str(b.phone)}, ${str(b.email) ?? ""},
         ${str(b.package_id) ?? "PKG001"}, ${str(b.connection_type) ?? "prepaid"},
         ${str(b.join_date) ?? new Date().toISOString().slice(0, 10)},
         ${spend}, ${usage}, ${status.value ?? "active"})
      RETURNING *`;
    return NextResponse.json(normalize(rows[0]), { status: 201 });
  } catch (err) {
    return NextResponse.json(dbError("Customer save nahi ho saka", err), { status: 500 });
  }
}