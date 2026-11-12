import { neon } from "@neondatabase/serverless";

// Database se connection (DATABASE_URL .env.local file se aati hai)
export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL nahi mili. .env.local file check karein.");
  }
  return neon(process.env.DATABASE_URL);
}

// Database ki row ko frontend ke liye saaf karta hai
// (DATE ko "YYYY-MM-DD" text aur NUMERIC ko number bana deta hai)
export function normalize(row) {
  let date = row.join_date;
  if (date instanceof Date) {
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    date = `${date.getFullYear()}-${m}-${d}`;
  } else if (date) {
    date = String(date).slice(0, 10);
  }
  return { ...row, join_date: date, monthly_data_usage_gb: Number(row.monthly_data_usage_gb) };
}

// Text ko number banata hai: khali ho to null, number na ho to NaN
export function num(v) {
  if (v === undefined || v === null || v === "") return null;
  return Number(v);
}

// Text field saaf karta hai: na ho to null (UPDATE mai purani value rehti hai)
export function str(v) {
  return v === undefined || v === null ? null : String(v).trim();
}

// Error ka jawab banata hai (detail sirf development mai dikhti hai)
export function dbError(message, err) {
  console.error(err);
  const body = { error: message };
  if (process.env.NODE_ENV !== "production") body.detail = err.message;
  return body;
}