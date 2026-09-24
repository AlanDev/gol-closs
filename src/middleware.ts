import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en /admin y bloquea el acceso a quien no
 * sea el ADMIN_EMAIL. Las server actions vuelven a validar por su cuenta.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esLogin = request.nextUrl.pathname.startsWith("/admin/login");
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const autorizado = !!user?.email && !!admin && user.email.toLowerCase() === admin;

  if (!esLogin && !autorizado) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = user ? "?error=no-autorizado" : "";
    return NextResponse.redirect(url);
  }
  if (esLogin && autorizado) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
