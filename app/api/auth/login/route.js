import { NextResponse } from "next/server";
import { getLoginCredentials, sessionCookie } from "@/lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const credentials = getLoginCredentials();
  if (body.username !== credentials.username || body.password !== credentials.password) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(sessionCookie());
  return response;
}
