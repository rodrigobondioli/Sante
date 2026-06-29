import { NextRequest, NextResponse } from "next/server";

// Rotas públicas que funcionam em QUALQUER domínio (landing, menu de cliente, kiosk)
const PUBLIC_PREFIXES = ["/menu", "/kiosk", "/_next", "/favicon", "/api"];

const APP_HOST = "app.superbar.com.br";

export function middleware(req: NextRequest) {
  const host     = req.headers.get("host") ?? "";
  const pathname = req.nextUrl.pathname;

  // Em dev local (localhost / 127.0.0.1) — deixa passar sempre
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    return NextResponse.next();
  }

  // Rotas públicas — passam em qualquer domínio
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Fora do app.superbar.com.br → 404
  if (host !== APP_HOST && !host.startsWith(`${APP_HOST}:`)) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica em tudo EXCETO arquivos estáticos do Next.js e imagens.
     * O padrão abaixo é o recomendado pela Vercel.
     */
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|ico|webp|woff2?|ttf)).*)",
  ],
};
