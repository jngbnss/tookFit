"use client";

import Link from "next/link";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { validateEmail } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="container page narrow" style={{ maxWidth: 420 }}>
      <h1 className="page-title">비밀번호 찾기</h1>
      {sent ? (
        <div className="stack">
          <p>입력하신 이메일이 가입되어 있다면, 비밀번호 재설정 링크를 보냈어요. 메일함을 확인해주세요.</p>
          <Link className="btn btn-outline" href="/login">
            로그인으로
          </Link>
        </div>
      ) : (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const err = validateEmail(email);
            if (err) return setError(err);
            setBusy(true);
            setError(null);
            try {
              await authApi.requestPasswordReset({ email: email.trim() });
              setSent(true);
            } catch (ex) {
              setError(errorMessage(ex));
            } finally {
              setBusy(false);
            }
          }}
        >
          <p className="small muted">가입한 이메일을 입력하면 비밀번호를 다시 정할 수 있는 링크를 보내드려요. 소셜 로그인 회원은 해당 서비스로 로그인해주세요.</p>
          <label className="field">
            <span>이메일</span>
            <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-block" disabled={busy}>
            재설정 링크 받기
          </button>
        </form>
      )}
    </div>
  );
}
