import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { serverGetOr } from "@/lib/api/server";
import type { NoticeSummary, Page } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "공지사항" };

type Props = { searchParams: Promise<{ page?: string }> };

export default async function NoticesPage({ searchParams }: Props) {
  const page = Math.max(0, Number((await searchParams).page ?? 1) - 1 || 0);
  const data = await serverGetOr<Page<NoticeSummary>>("/notices", { items: [], page: 0, size: 0, totalElements: 0, totalPages: 0 }, { page });

  return (
    <div className="container page narrow">
      <h1 className="page-title">공지사항</h1>
      {data.items.length === 0 ? (
        <p className="empty">공지사항이 없어요.</p>
      ) : (
        <ul>
          {data.items.map((n) => (
            <li key={n.id} className="row between" style={{ padding: "14px 0", borderBottom: "1px solid var(--line)", flexWrap: "nowrap" }}>
              <Link href={`/notices/${n.id}`}>
                {n.pinned && <strong className="accent">[공지] </strong>}
                {n.title}
              </Link>
              <span className="small muted" style={{ whiteSpace: "nowrap" }}>
                {formatDate(n.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={data.page} totalPages={data.totalPages} href={(p) => `/notices?page=${p + 1}`} />
    </div>
  );
}
