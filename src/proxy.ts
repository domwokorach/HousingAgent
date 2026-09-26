import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 renamed Middleware to Proxy; the file is `proxy.ts` and sits
 * beside `app`. See node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
 *
 * This app has no server-side session — accounts live in localStorage — so
 * there is nothing to authorise here. What Proxy is good for, and what it does
 * below, is setting response headers for every page.
 *
 * Route protection is handled in the UI by `RequireAuth`. That is an
 * affordance, not a security boundary: see src/lib/auth.ts.
 */

/**
 * `img-src` has to allow `data:` because uploaded photos are stored as data
 * URLs. Fonts are self-hosted by `next/font`, so `'self'` covers them.
 * Scripts and styles need `'unsafe-inline'` for Next's hydration payload and
 * React's inline style props; a stricter policy would need nonce plumbing.
 *
 * Mapbox GL needs more than the defaults, and fails silently without it:
 *  - `connect-src` for tiles, styles, geocoding and telemetry,
 *  - `worker-src blob:` because it compiles its workers from blob URLs,
 *  - `img-src blob:` for the sprites and canvas textures it generates.
 */
const MAPBOX_ORIGINS = "https://api.mapbox.com https://events.mapbox.com";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${MAPBOX_ORIGINS}`,
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  // Helps when debugging which route produced a response.
  response.headers.set("x-pathname", request.nextUrl.pathname);

  return response;
}

export const config = {
  // Everything except Next's own assets and the static files in public/.
  matcher: [
    "/((?!_next/static|_next/image|icons/|images/|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
