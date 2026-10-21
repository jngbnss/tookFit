"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "../providers/Settings";

const LINKS = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "주문" },
  { href: "/admin/claims", label: "교환·반품" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/categories", label: "카테고리" },
  { href: "/admin/users", label: "회원" },
  { href: "/admin/reviews", label: "리뷰" },
  { href: "/admin/coupons", label: "쿠폰" },
  { href: "/admin/banners", label: "배너" },
  { href: "/admin/notices", label: "공지" },
  { href: "/admin/settings", label: "설정" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { storeName } = useSettings();
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  return (
    <aside className="admin-side">
      <Link href="/admin" className="logo">
        {storeName} 관리자
      </Link>
      <nav aria-label="관리자 메뉴">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        <Link href="/" style={{ marginTop: 16 }}>
          ← 쇼핑몰로
        </Link>
      </nav>
    </aside>
  );
}
