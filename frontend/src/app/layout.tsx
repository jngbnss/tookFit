import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import { getStoreSettings, siteUrl } from "@/lib/api/server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getStoreSettings();
  const name = settings.storeName;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${name} — 남성 의류`, template: `%s | ${name}` },
    description: `${name} 공식 온라인 스토어. 매일 입는 남성 의류.`,
    openGraph: { type: "website", siteName: name, locale: "ko_KR" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

// 첫 화면이 그려지기 전에 테마를 적용해 깜빡임을 막는다
const themeScript = `(function(){try{var t=localStorage.getItem('tukfit.theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getStoreSettings();
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>
        <AppProviders settings={settings}>{children}</AppProviders>
      </body>
    </html>
  );
}
