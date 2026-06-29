import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Domínio canônico do app
const APP_HOST = "app.superbar.com.br";

// Domínios raiz que devem redirecionar para o app (landing ainda não existe neste repo)
const ROOT_HOSTS = ["superbar.com.br", "www.superbar.com.br"];

// Rotas públicas que funcionam em qualquer domínio (menu do cliente, kiosk, API)
const PUBLIC_PREFIXES = ["/menu", "/kiosk", "/_next", "/favicon", "/api"];

export async function proxy(request: NextRequest) {
  const host     = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  const isLocal  = host.startsWith("localhost") || host.startsWith("127.0.0.1");

  // Redireciona domínios raiz para o app
  if (!isLocal && ROOT_HOSTS.some(h => host === h || host.startsWith(`${h}:`))) {
    const target = new URL(request.url);
    target.host  = APP_HOST;
    target.port  = "";
    target.protocol = "https:";
    return NextResponse.redirect(target.toString(), 301);
  }

  // Bloqueia qualquer outro domínio desconhecido (exceto rotas públicas)
  if (
    !isLocal &&
    !PUBLIC_PREFIXES.some(p => pathname.startsWith(p)) &&
    host !== APP_HOST &&
    !host.startsWith(`${APP_HOST}:`)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
