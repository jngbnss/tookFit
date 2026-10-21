"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { safeRedirect } from "@/lib/redirect";
import { useAuth } from "../providers/Auth";
import { SocialButtons } from "./SocialButtons";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { me, ready, setMe } = useAuth();
  const redirect = safeRedirect(params.get("redirect"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error") === "oauth" ? "소셜 로그인에 실패했어요. 다시 시도해주세요." : null);
  const [busy, setBusy] = useState(false);

  // 이미 로그인되어 있으면 원래 가려던 곳으로 보낸다
  useEffect(() => {
    if (ready && me) router.replace(redirect);
  }, [ready, me, redirect, router]);

  return (
    <div className="stack">
      <SocialButtons redirect={redirect} />
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!email.trim() || !password) return setError("이메일과 비밀번호를 입력해주세요.");
          setBusy(true);
          try {
            const user = await authApi.login({ email: email.trim(), password });
            setMe(user);
            router.replace(redirect);
          } catch (err) {
            setError(errorMessage(err));
            setBusy(false);
          }
        }}
      >
        <label className="field">
          <span>이메일</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-block" disabled={busy}>
          {busy ? "로그인 중…" : "로그인"}
        </button>
      </form>
      <div className="row between small">
        <Link className="link" href={`/signup?redirect=${encodeURIComponent(redirect)}`}>
          회원가입
        </Link>
        <Link className="link muted" href="/password/forgot">
          비밀번호 찾기
        </Link>
      </div>
    </div>
  );
}
