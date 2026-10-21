import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { serverGetOr, serverGetOr404 } from "@/lib/api/server";
import type { Notice } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const n = Number(id) ? await serverGetOr<Notice | null>(`/notices/${Number(id)}`, null) : null;
  return { title: n?.title ?? "공지사항" };
}

export default async function NoticePage({ params }: Props) {
  const { id } = await params;
  if (!Number(id)) notFound();
  const notice = await serverGetOr404<Notice>(`/notices/${Number(id)}`);
  return (
    <div className="container page narrow">
      <p className="small muted">
        <Link href="/notices">공지사항</Link> · {formatDate(notice.createdAt)}
      </p>
      <h1 className="page-title" style={{ marginTop: 8 }}>
        {notice.title}
      </h1>
      <div className="prose">{notice.body}</div>
      <hr className="divider" />
      <Link className="btn btn-ghost" href="/notices">
        목록
      </Link>
    </div>
  );
}
