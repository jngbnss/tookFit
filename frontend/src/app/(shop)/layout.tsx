import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getStoreSettings, serverGetOr } from "@/lib/api/server";
import type { Banner, Category } from "@/lib/api/types";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const [settings, categories, strip] = await Promise.all([
    getStoreSettings(),
    serverGetOr<Category[]>("/categories", []),
    serverGetOr<Banner[]>("/banners", [], { position: "TOP_STRIP" }),
  ]);

  return (
    <>
      <a href="#main" className="skip-link">
        본문 바로가기
      </a>
      {strip[0] && (
        <div className="top-strip">
          {strip[0].linkUrl ? <a href={strip[0].linkUrl}>{strip[0].title}</a> : strip[0].title}
        </div>
      )}
      <Header categories={categories} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
