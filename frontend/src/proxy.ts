import { NextResponse, type NextRequest } from "next/server";

// 백엔드로 넘길 경로. 운영에서는 Nginx가 먼저 가로채므로 여기까지 오지 않고,
// 로컬 개발이나 Nginx 없이 프론트만 띄웠을 때 쓰인다.
// next.config의 rewrites는 빌드 시점에 주소가 고정되므로, 요청 시점에 환경변수를 읽도록 proxy에서 처리한다.
export function proxy(request: NextRequest) {
  const apiUrl = process.env.INTERNAL_API_URL ?? "http://localhost:8081";
  const { pathname, search } = request.nextUrl;
  return NextResponse.rewrite(new URL(pathname + search, apiUrl));
}

export const config = {
  matcher: ["/api/:path*", "/oauth2/:path*", "/login/oauth2/:path*"],
};
