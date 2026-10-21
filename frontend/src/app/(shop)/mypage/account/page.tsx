"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/Auth";
import { useToast } from "@/components/providers/Toast";
import { authApi } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/client";
import { validatePassword } from "@/lib/validation";

export default function AccountPage() {
  const { me, reload, setMe } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [next2, setNext2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!me) return null;

  return (
    <div className="stack" style={{ gap: 40 }}>
      <section>
        <h1 className="page-title">계정 설정</h1>
        <form
          className="panel stack"
          onSubmit={async (e) => {
            e.preventDefault();
            const err = (me.hasPassword && !current ? "현재 비밀번호를 입력해주세요." : null) ?? validatePassword(next) ?? (next !== next2 ? "새 비밀번호가 서로 달라요." : null);
            if (err) return setError(err);
            setBusy(true);
            setError(null);
            try {
              await authApi.changePassword({ currentPassword: me.hasPassword ? current : undefined, newPassword: next });
              setCurrent("");
              setNext("");
              setNext2("");
              await reload();
              notify("비밀번호를 바꿨어요.");
            } catch (ex) {
              setError(errorMessage(ex));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2 className="panel-title" style={{ marginBottom: 0 }}>
            {me.hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
          </h2>
          {!me.hasPassword && <p className="small muted">소셜 로그인으로 가입하셨어요. 비밀번호를 설정하면 이메일로도 로그인할 수 있어요.</p>}
          {me.hasPassword && (
            <label className="field">
              <span>현재 비밀번호</span>
              <input className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </label>
          )}
          <label className="field">
            <span>새 비밀번호</span>
            <input className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </label>
          <label className="field">
            <span>새 비밀번호 확인</span>
            <input className="input" type="password" autoComplete="new-password" value={next2} onChange={(e) => setNext2(e.target.value)} />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div>
            <button className="btn" disabled={busy}>
              저장
            </button>
          </div>
        </form>
      </section>

      <section className="panel stack">
        <h2 className="panel-title" style={{ marginBottom: 0 }}>
          회원 탈퇴
        </h2>
        <p className="small muted">탈퇴하면 개인정보는 지워지고 되돌릴 수 없어요. 진행 중인 주문이 있으면 탈퇴할 수 없어요. 주문 기록은 관련 법에 따라 일정 기간 보관돼요.</p>
        <div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={async () => {
              if (!confirm("정말 탈퇴할까요? 되돌릴 수 없어요.")) return;
              try {
                await authApi.withdraw();
                setMe(null);
                notify("탈퇴했어요. 그동안 이용해주셔서 감사합니다.");
                router.replace("/");
              } catch (ex) {
                notify(errorMessage(ex), "error");
              }
            }}
          >
            탈퇴하기
          </button>
        </div>
      </section>
    </div>
  );
}
