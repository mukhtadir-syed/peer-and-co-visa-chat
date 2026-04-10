import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Area", charset="UTF-8"',
    },
  });
}

export function proxy(request: NextRequest) {
  const expectedUsername = process.env.BASIC_AUTH_USERNAME;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  // If auth is not configured, continue without blocking.
  if (!expectedUsername || !expectedPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const base64Credentials = authHeader.slice("Basic ".length).trim();
  let decoded = "";
  try {
    decoded = atob(base64Credentials);
  } catch {
    return unauthorizedResponse();
  }
  const separatorIndex = decoded.indexOf(":");
  const username = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : "";
  const password = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

  if (username !== expectedUsername || password !== expectedPassword) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
