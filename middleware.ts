import { NextRequest, NextResponse } from "next/server";

function unauthorizedResponse() {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Alu Realty Group Admin"'
    }
  });
}

export function middleware(request: NextRequest) {
  const username = process.env.ADMIN_DASHBOARD_USERNAME || "admin";
  const password = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!password) {
    return new NextResponse("Admin dashboard password is not configured.", {
      status: 503
    });
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const encodedCredentials = authHeader.replace("Basic ", "");
  let decodedCredentials = "";

  try {
    decodedCredentials = atob(encodedCredentials);
  } catch {
    return unauthorizedResponse();
  }

  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorizedResponse();
  }

  const submittedUsername = decodedCredentials.slice(0, separatorIndex);
  const submittedPassword = decodedCredentials.slice(separatorIndex + 1);

  if (submittedUsername !== username || submittedPassword !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
