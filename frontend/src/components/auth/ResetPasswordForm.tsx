"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { validatePassword } from "@/lib/validation";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!token) return <p className="form-error">링크가 올바르지 않아요. 비밀번호 찾기를 다시 진행해주세요.</p>;
  if (done)
    return (
      <div className="stack">
        <p>비밀번호를 바꿨어요. 새 비밀번호로 로그인해주세요.</p>
        <Link className="btn" href="/login">
          로그인
        </Link>
      </div>
    );

  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        const err = validatePassword(pw) ?? (pw !== pw2 ? "비밀번호가 서로 달라요." : null);
        if (err) return setError(err);
        setBusy(true);
        setError(null);
        try {
          await authApi.resetPassword({ token, newPassword: pw });
          setDone(true);
        } catch (ex) {
          setError(errorMessage(ex));
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        <span>새 비밀번호</span>
        <input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <span className="small muted">8~64자, 영문과 숫자 포함</span>
      </label>
      <label className="field">
        <span>새 비밀번호 확인</span>
        <input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-block" disabled={busy}>
        비밀번호 바꾸기
      </button>
    </form>
  );
}
