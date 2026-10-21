import Link from "next/link";
import type { StoreSettings } from "@/lib/api/types";

export function Footer({ settings }: { settings: StoreSettings }) {
  const b = settings.business;
  const hasBusiness = Boolean(b.companyName && b.registrationNumber);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3>{settings.storeName}</h3>
            <p>매일 입는 옷을 더 좋게.</p>
          </div>
          <div>
            <h3>고객센터</h3>
            <ul>
              <li>{settings.csPhone ?? "전화 준비 중"}</li>
              {settings.csEmail && <li>{settings.csEmail}</li>}
              {settings.csHours && <li>{settings.csHours}</li>}
            </ul>
          </div>
          <div>
            <h3>안내</h3>
            <ul>
              <li>
                <Link href="/notices">공지사항</Link>
              </li>
              <li>
                <Link href="/policy/shipping-returns">배송·교환·반품</Link>
              </li>
              <li>
                <Link href="/policy/terms">이용약관</Link>
              </li>
              <li>
                <Link href="/policy/privacy">
                  <strong>개인정보처리방침</strong>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="business-info">
          {hasBusiness ? (
            <p>
              상호 {b.companyName} · 대표 {b.ceoName ?? "-"} · 사업자등록번호 {b.registrationNumber}
              {b.mailOrderNumber && <> · 통신판매업 신고 {b.mailOrderNumber}</>}
              <br />
              {b.address && <>주소 {b.address} · </>}
              {b.privacyOfficer && <>개인정보보호책임자 {b.privacyOfficer}</>}
            </p>
          ) : (
            <p>사업자 정보 준비 중</p>
          )}
          <p>© {new Date().getFullYear()} {settings.storeName}</p>
        </div>
      </div>
    </footer>
  );
}
