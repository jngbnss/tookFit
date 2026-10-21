"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { catalogApi } from "@/lib/api/catalog";
import type { Category, Suggestion } from "@/lib/api/types";
import { BagIcon, HeartIcon, MoonIcon, SearchIcon, SunIcon, UserIcon } from "../Icons";
import { useAuth } from "../providers/Auth";
import { useCart } from "../providers/Cart";
import { useSettings } from "../providers/Settings";

const COLLECTIONS = [
  { href: "/shop/new-arrivals", label: "신상품" },
  { href: "/shop/best-sellers", label: "베스트" },
];

export function Header({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const { me } = useAuth();
  const { count } = useCart();
  const { storeName } = useSettings();

  const nav = [
    ...COLLECTIONS,
    ...categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.name })),
    { href: "/shop/sale", label: "세일" },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          {storeName}
        </Link>
        <nav className="main-nav" aria-label="카테고리">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname === n.href ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <SearchBox />
          <ThemeToggle />
          <Link href="/mypage/wishlist" className="icon-btn" aria-label="위시리스트">
            <HeartIcon />
          </Link>
          <Link href={me ? "/mypage" : "/login"} className="icon-btn" aria-label={me ? "마이페이지" : "로그인"}>
            <UserIcon />
          </Link>
          {me?.role === "ADMIN" && (
            <Link href="/admin" className="btn btn-sm btn-ghost">
              관리자
            </Link>
          )}
          <Link href="/cart" className="icon-btn" aria-label={`장바구니 ${count}개`}>
            <BagIcon />
            {count > 0 && <span className="count-badge">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}

function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) return;
    const t = setTimeout(() => {
      catalogApi
        .suggestions(term)
        .then((list) => {
          setItems(list.slice(0, 8));
          setActive(-1);
        })
        .catch(() => setItems([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && items[active]) return go(`/products/${items[active].slug}`);
        if (q.trim()) go(`/shop/all?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label className="sr-only" htmlFor={`${listId}-input`}>
        상품 검색
      </label>
      <input
        id={`${listId}-input`}
        type="search"
        placeholder="검색"
        value={q}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={listId}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) setItems([]);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, items.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, -1));
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && q.trim() && items.length > 0 && (
        <div className="suggest" id={listId} role="listbox">
          {items.map((s, i) => (
            <a
              key={s.slug}
              href={`/products/${s.slug}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                go(`/products/${s.slug}`);
              }}
            >
              {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt="" /> : <SearchIcon className="w-4 h-4" />}
              {s.name}
            </a>
          ))}
        </div>
      )}
    </form>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 테마는 html 속성에서 마운트 후 읽는다
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={dark ? "밝은 화면으로" : "어두운 화면으로"}
      onClick={() => {
        const next = dark ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("tukfit.theme", next);
        } catch {
          // 저장하지 못해도 이번 화면에는 적용된다
        }
        setDark(!dark);
      }}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
