"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container page narrow stack" style={{ alignItems: "flex-start" }}>
      <h1 className="page-title">잠시 문제가 생겼어요</h1>
      <p className="muted">잠시 후 다시 시도해주세요.{error.digest ? ` (오류 코드 ${error.digest})` : ""}</p>
      <button type="button" className="btn" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
