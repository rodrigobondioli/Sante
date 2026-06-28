import { type NextRequest, NextResponse } from "next/server";
import { getBarByKioskToken } from "@/lib/kiosk/queries";
import { KIOSK_COOKIE } from "@/lib/kiosk/constants";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Link inválido — token ausente.", { status: 400 });
  }

  const bar = await getBarByKioskToken(token);

  if (!bar) {
    return new NextResponse("Token inválido ou revogado. Peça ao dono para gerar um novo link.", { status: 401 });
  }

  const response = NextResponse.redirect(new URL("/garcom", request.url));
  response.cookies.set(KIOSK_COOKIE, `${bar.id}:${token}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });

  return response;
}
