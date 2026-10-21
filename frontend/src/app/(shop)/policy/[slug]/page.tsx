import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreSettings } from "@/lib/api/server";
import { formatPrice } from "@/lib/format";

// 정책 문구는 초안이다. 사업자등록 후 실제 내용으로 바꾸고, 필요하면 관리자 화면에서 고칠 수 있게 옮긴다.

const TITLES = {
  terms: "이용약관",
  privacy: "개인정보처리방침",
  "shipping-returns": "배송·교환·반품 안내",
} as const;
type Slug = keyof typeof TITLES;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: TITLES[slug as Slug] ?? "안내" };
}

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params;
  if (!(slug in TITLES)) notFound();
  const s = await getStoreSettings();
  const b = s.business;
  const company = b.companyName ?? s.storeName;

  const body: Record<Slug, string> = {
    terms: `제1조 (목적)
이 약관은 ${company}(이하 "회사")가 운영하는 온라인 스토어에서 제공하는 서비스의 이용 조건과 절차, 회사와 회원의 권리·의무를 정합니다.

제2조 (회원가입)
이용자는 회사가 정한 양식에 따라 회원 정보를 입력하고 약관에 동의하여 회원가입을 신청합니다.

제3조 (구매 신청과 계약 성립)
회원은 상품을 선택하고 배송지와 결제 수단을 입력해 구매를 신청하며, 결제가 승인되면 계약이 성립합니다.

제4조 (청약 철회)
회원은 상품을 받은 날부터 7일 이내에 청약을 철회할 수 있습니다. 단, 회원의 책임으로 상품이 훼손된 경우 등 관련 법령이 정한 경우는 제외합니다.

※ 이 약관은 초안입니다. 사업자 정보 확정 후 전문가 검토를 거쳐 갱신됩니다.`,
    privacy: `${company}은(는) 개인정보 보호법에 따라 이용자의 개인정보를 보호합니다.

1. 수집 항목
- 회원가입: 이름, 이메일, 비밀번호(암호화), 휴대폰 번호(선택)
- 주문: 받는 분, 연락처, 배송지 주소
- 소셜 로그인: 서비스 제공자가 전달하는 식별자, 이름, 이메일(동의 시)

2. 이용 목적
회원 관리, 주문·배송·교환·반품 처리, 고객 문의 응대, (동의 시) 혜택 안내

3. 보관 기간
회원 탈퇴 시 지체 없이 파기합니다. 단, 전자상거래법에 따라 계약·결제 기록은 5년, 소비자 불만·분쟁 기록은 3년 보관합니다.

4. 처리 위탁
결제대행사(PG), 택배사, 클라우드 서버 제공자에 업무를 위탁합니다.

5. 개인정보 보호책임자
${b.privacyOfficer ?? "준비 중"} · ${s.csEmail ?? "이메일 준비 중"}`,
    "shipping-returns": `배송
- 기본 배송비 ${formatPrice(s.shippingFee)}, ${formatPrice(s.freeShippingThreshold)} 이상 구매 시 무료배송
- 결제 후 영업일 기준 1~3일 안에 출고됩니다.

교환·반품
- 상품을 받은 날부터 7일 이내에 마이페이지 > 주문 내역에서 신청할 수 있어요.
- 단순 변심, 사이즈 교환은 왕복 배송비 ${formatPrice(s.returnShippingFee)}을(를) 고객님이 부담해요.
- 상품 불량, 오배송은 쇼핑몰이 배송비를 부담해요.
- 착용 흔적이 있거나 택을 제거한 상품, 고객님 책임으로 훼손된 상품은 교환·반품이 어려워요.

환불
- 반품 상품이 도착해 확인되면 영업일 기준 3일 안에 결제 수단으로 환불돼요.

문의: ${s.csPhone ?? "고객센터 준비 중"}${s.csHours ? ` (${s.csHours})` : ""}`,
  };

  return (
    <div className="container page narrow">
      <h1 className="page-title">{TITLES[slug as Slug]}</h1>
      <div className="prose">{body[slug as Slug]}</div>
    </div>
  );
}
