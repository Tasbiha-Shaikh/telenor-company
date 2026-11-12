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

// PUT /api/customers/C1001  ->  customer update
// (jo field na bheji jaye, us ki purani value rehti hai)
export async function PUT(request, { params }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const b = await request.json();

    const age = num(b.age);
    const spend = num(b.monthly_spend_pkr);
    const usage = num(b.monthly_data_usage_gb);
    if ([age, spend, usage].some(Number.isNaN)) {
      return NextResponse.json({ error: "age, spend and usage must be numbers" }, { status: 400 });
    }
    const status = parseStatus(b.status);
    if (status.invalid) {
      return NextResponse.json({ error: "status must be active, inactive or suspended" }, { status: 400 });
    }

    const sql = getSql();
    const rows = await sql`
      UPDATE customers SET
        name = COALESCE(${str(b.name)}, name),
        gender = COALESCE(${str(b.gender)}, gender),
        age = COALESCE(${age}, age),
        city = COALESCE(${str(b.city)}, city),
        province = COALESCE(${str(b.province)}, province),
        phone = COALESCE(${str(b.phone)}, phone),
        email = COALESCE(${str(b.email)}, email),
        package_id = COALESCE(${str(b.package_id)}, package_id),
        connection_type = COALESCE(${str(b.connection_type)}, connection_type),
        monthly_spend_pkr = COALESCE(${spend}, monthly_spend_pkr),
        monthly_data_usage_gb = COALESCE(${usage}, monthly_data_usage_gb),
        status = COALESCE(${status.value}, status)
      WHERE customer_id = ${id}
      RETURNING *`;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(normalize(rows[0]));
  } catch (err) {
    return NextResponse.json(dbError("Update nahi ho saka", err), { status: 500 });
  }
}

// DELETE /api/customers/C1001  ->  customer delete
export async function DELETE(request, { params }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const sql = getSql();
    const rows = await sql`DELETE FROM customers WHERE customer_id = ${id} RETURNING customer_id`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json({ deleted: id });
  } catch (err) {
    return NextResponse.json(dbError("Delete nahi ho saka", err), { status: 500 });
  }
}