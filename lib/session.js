import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // Keep the session for seven days.

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Set SESSION_SECRET to at least 32 characters in .env.local.");
  }
  return new TextEncoder().encode(secret);
}

// Create a signed token after login and store it in a cookie.
export async function createToken(username) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getKey());
}

// Return the token payload when valid and unexpired; otherwise return null.
export async function verifyToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey());
    return payload;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true, // Prevent JavaScript from reading the cookie.
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};