import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "telenor_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.AUTH_SECRET || "development-only-change-this-secret";
}

export function getLoginCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "telenor123",
  };
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createToken() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const value = `admin:${expiresAt}`;
  return `${value}.${sign(value)}`;
}

function isValidToken(token) {
  if (!token) return false;
  const [value, signature] = token.split(".");
  const expectedSignature = value ? sign(value) : "";
  if (!value || !signature || signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return false;
  }
  const expiresAt = Number(value.split(":")[1]);
  return value.startsWith("admin:") && Number.isFinite(expiresAt) && expiresAt > Math.floor(Date.now() / 1000);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return isValidToken(cookieStore.get(COOKIE_NAME)?.value);
}

export function sessionCookie() {
  return {
    name: COOKIE_NAME,
    value: createToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  };
}

export const sessionCookieName = COOKIE_NAME;
