"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { errorMessage, isApiError } from "@/lib/api/client";
import { formatPhone } from "@/lib/format";
import { safeRedirect } from "@/lib/redirect";
import { validateEmail, validatePassword, validatePhone } from "@/lib/validation";
import { useAuth } from "../providers/Auth";
import { SocialButtons } from "./SocialButtons";

type Errors = Partial<Record<"email" | "password" | "password2" | "name" | "phone" | "terms", string>>;

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { setMe } = useAuth();
  const redirect = safeRedirect(params.get("redirect"));
  const [form, setForm] = useState({ email: "", password: "", password2: "", name: "", phone: "" });
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const allAgreed = agree.terms && agree.privacy && agree.marketing;

  const validate = (): Errors => {
    const e: Errors = {};
    const em = validateEmail(form.email);
    if (em) e.email = em;
    const pw = validatePassword(form.password);
    if (pw) e.password = pw;
    if (form.password !== form.password2) e.password2 = "비밀번호가 서로 달라요.";
    if (!form.name.trim()) e.name = "이름을 입력해주세요.";
    const ph = validatePhone(form.phone);
    if (ph) e.phone = ph;
    if (!agree.terms || !agree.privacy) e.terms = "필수 약관에 동의해주세요.";
    return e;
  };

  return (
    <div className="stack">
      <SocialButtons redirect={redirect} />
      <form
        className="stack"
        noValidate
        onSubmit={async (ev) => {
          ev.preventDefault();
          setFormError(null);
          const e = validate();
          setErrors(e);
          if (Object.keys(e).length) return;
          setBusy(true);
          try {
            const me = await authApi.signup({
              email: form.email.trim(),
              password: form.password,
              name: form.name.trim(),
              phone: form.phone.trim() || undefined,
              agreeTerms: agree.terms,
              agreePrivacy: agree.privacy,
              agreeMarketing: agree.marketing,
            });
            setMe(me);
            router.replace(redirect);
          } catch (err) {
            if (isApiError(err) && err.fields) setErrors(err.fields as Errors);
            setFormError(errorMessage(err));
            setBusy(false);
          }
        }}
      >
        <label className="field">
          <span>이메일</span>
          <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label className="field">
          <span>비밀번호</span>
          <input className="input" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} aria-invalid={!!errors.password} />
          <span className="small muted">8~64자, 영문과 숫자 포함</span>
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>
        <label className="field">
          <span>비밀번호 확인</span>
          <input className="input" type="password" autoComplete="new-password" value={form.password2} onChange={(e) => set("password2", e.target.value)} aria-invalid={!!errors.password2} />
          {errors.password2 && <span className="field-error">{errors.password2}</span>}
        </label>
        <label className="field">
          <span>이름</span>
          <input className="input" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
        <label className="field">
          <span>휴대폰 (선택)</span>
          <input className="input" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} aria-invalid={!!errors.phone} />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>

        <fieldset className="panel stack-sm" style={{ margin: 0 }}>
          <legend className="sr-only">약관 동의</legend>
          <label className="check" style={{ fontWeight: 600 }}>
            <input type="checkbox" checked={allAgreed} onChange={(e) => setAgree({ terms: e.target.checked, privacy: e.target.checked, marketing: e.target.checked })} />
            전체 동의
          </label>
          <hr className="divider" style={{ margin: "6px 0" }} />
          <label className="check">
            <input type="checkbox" checked={agree.terms} onChange={(e) => setAgree((a) => ({ ...a, terms: e.target.checked }))} />
            <span>
              (필수) <Link className="link" href="/policy/terms" target="_blank">이용약관</Link> 동의
            </span>
          </label>
          <label className="check">
            <input type="checkbox" checked={agree.privacy} onChange={(e) => setAgree((a) => ({ ...a, privacy: e.target.checked }))} />
            <span>
              (필수) <Link className="link" href="/policy/privacy" target="_blank">개인정보 수집·이용</Link> 동의
            </span>
          </label>
          <label className="check">
            <input type="checkbox" checked={agree.marketing} onChange={(e) => setAgree((a) => ({ ...a, marketing: e.target.checked }))} />
            (선택) 할인·이벤트 소식 받기
          </label>
          {errors.terms && <span className="field-error">{errors.terms}</span>}
        </fieldset>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
        <button className="btn btn-block" disabled={busy}>
          {busy ? "가입 중…" : "가입하기"}
        </button>
      </form>
      <p className="small" style={{ textAlign: "center" }}>
        이미 회원이신가요?{" "}
        <Link className="link" href={`/login?redirect=${encodeURIComponent(redirect)}`}>
          로그인
        </Link>
      </p>
    </div>
  );
}
