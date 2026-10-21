import type { NextConfig } from "next";

// 도메인, 백엔드 주소는 빌드에 굽지 않는다. (이미지는 CI에서 한 번 빌드하고, 주소는 서버 환경변수로 넣음)
// /api 등 백엔드 경로 전달은 src/proxy.ts가 요청 시점의 INTERNAL_API_URL을 읽어서 처리한다.
const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
