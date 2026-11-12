import { neon } from "@neondatabase/serverless";

// Connect to the database using DATABASE_URL from .env.local.
export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Check your .env.local file.");
  }
  return neon(process.env.DATABASE_URL);
}

// Normalize a database row for the frontend.
// Convert DATE to "YYYY-MM-DD" text and NUMERIC values to numbers.
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

// Convert text to a number; empty values become null.
export function num(v) {
  if (v === undefined || v === null || v === "") return null;
  return Number(v);
}

// Normalize a text field; undefined and null values become null.
export function str(v) {
  return v === undefined || v === null ? null : String(v).trim();
}

// Build an error response and expose details only in development.
export function dbError(message, err) {
  console.error(err);
  const body = { error: message };
  if (process.env.NODE_ENV !== "production") body.detail = err.message;
  return body;
}