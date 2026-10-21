"use client";

import { socialLoginUrl } from "@/lib/api/auth";
import { useSettings } from "../providers/Settings";

export function SocialButtons({ redirect }: { redirect: string }) {
  const { socialProviders } = useSettings();
  if (!socialProviders.length) return null;
  return (
    <div className="stack-sm">
      {socialProviders.includes("KAKAO") && (
        <a className="btn btn-block btn-kakao" href={socialLoginUrl("KAKAO", redirect)}>
          카카오로 시작하기
        </a>
      )}
      {socialProviders.includes("NAVER") && (
        <a className="btn btn-block btn-naver" href={socialLoginUrl("NAVER", redirect)}>
          네이버로 시작하기
        </a>
      )}
      <p className="small muted" style={{ textAlign: "center", margin: "8px 0" }}>
        또는 이메일로
      </p>
    </div>
  );
}
