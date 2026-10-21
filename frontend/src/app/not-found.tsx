import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container page narrow stack" style={{ alignItems: "flex-start" }}>
      <h1 className="page-title">페이지를 찾을 수 없어요</h1>
      <p className="muted">주소가 바뀌었거나 판매가 끝난 상품일 수 있어요.</p>
      <Link className="btn" href="/">
        홈으로
      </Link>
    </div>
  );
}
