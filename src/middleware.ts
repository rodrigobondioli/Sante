import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Mantido para compatibilidade futura — lógica de host está em (marketing)/page.tsx
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
