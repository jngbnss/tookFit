import Link from "next/link";

type Props = {
  page: number; // 0부터
  totalPages: number;
  /** 링크 방식: 페이지 번호를 받아 href를 만든다 */
  href?: (page: number) => string;
  /** 버튼 방식 */
  onChange?: (page: number) => void;
};

/** 현재 페이지 주변 5개 번호와 이전/다음을 보여준다. */
export function Pagination({ page, totalPages, href, onChange }: Props) {
  if (totalPages <= 1) return null;
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  const item = (p: number, label: string, key: string, current = false, ariaLabel = `${p + 1}페이지`) => {
    if (p < 0 || p >= totalPages) return <span key={key} aria-hidden="true">{label}</span>;
    const common = { "aria-current": current ? ("page" as const) : undefined, "aria-label": ariaLabel };
    return href ? (
      <Link key={key} href={href(p)} {...common}>
        {label}
      </Link>
    ) : (
      <button key={key} type="button" onClick={() => onChange?.(p)} {...common}>
        {label}
      </button>
    );
  };

  return (
    <nav className="pagination" aria-label="페이지">
      {item(page - 1, "‹", "prev", false, "이전 페이지")}
      {pages.map((p) => item(p, String(p + 1), `p${p}`, p === page))}
      {item(page + 1, "›", "next", false, "다음 페이지")}
    </nav>
  );
}
