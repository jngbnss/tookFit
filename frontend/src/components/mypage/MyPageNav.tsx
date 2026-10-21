"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../providers/Auth";

const LINKS = [
  { href: "/mypage", label: "내 정보" },
  { href: "/mypage/orders", label: "주문 내역" },
  { href: "/mypage/reviews", label: "리뷰" },
  { href: "/mypage/wishlist", label: "위시리스트" },
  { href: "/mypage/addresses", label: "배송지" },
  { href: "/mypage/account", label: "계정 설정" },
];

export function MyPageNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { me, logout } = useAuth();
  const isActive = (href: string) => (href === "/mypage" ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="side-nav" aria-label="마이페이지">
      <p className="small muted" style={{ padding: "0 10px 8px" }}>
        {me?.name}님
      </p>
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
      <button
        type="button"
        className="small muted"
        style={{ textAlign: "left", padding: "8px 10px" }}
        onClick={async () => {
          await logout();
          router.replace("/");
        }}
      >
        로그아웃
      </button>
    </nav>
  );
}
