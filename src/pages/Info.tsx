import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CategorySlug } from '../domain/types';
import { isEmail } from '../lib/validation';
import { usePageMeta } from '../components/usePageMeta';

function InfoPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  usePageMeta(title, intro);
  return (
    <div className="container">
      <nav className="breadcrumbs" aria-label="현재 위치">
        <ol>
          <li>
            <Link to="/">홈</Link>
          </li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>
      <header className="catalog-head">
        <h1 className="page-title">{title}</h1>
        <p className="muted">{intro}</p>
      </header>
      <div className="prose">{children}</div>
    </div>
  );
}

export function About() {
  return (
    <InfoPage title="브랜드 소개" intro="TUK FIT는 서울의 겨울에서 출발한 모던 남성복 브랜드입니다.">
      <p>
        TUK FIT는 단순한 원칙에서 시작했습니다. <em>오래 간직할 것만 고르자.</em> 매 시즌 더 적은 옷을 디자인하고, 더 좋은 원단을 고르고, 몇 주가 아닌 몇
        년을 입어도 어색하지 않을 실루엣을 다듬습니다.
      </p>
      <h2>디자인</h2>
      <p>
        여유 있지만 계산된 실루엣 — 드롭 숄더, 긴 라인, 볼륨 있는 트라우저. 블랙, 차콜, 크림, 브라운, 네이비, 올리브의 차분한 팔레트로 옷장 안의 모든 옷이
        서로 어울리도록 만듭니다.
      </p>
      <h2>생산</h2>
      <ul>
        <li>이탈리아와 일본의 검증된 밀에서 공급받은 울과 캐시미어.</li>
        <li>국내 협력 공방에서 소량 생산하는 니트웨어.</li>
        <li>RDS(Responsible Down Standard) 인증 다운.</li>
        <li>성능이 허락하는 한 재생 나일론과 폴리에스터 사용.</li>
      </ul>
      <h2>이 사이트에 대하여</h2>
      <p>
        이 웹사이트는 TUK FIT 스토어의 프론트엔드 데모입니다. 상품 이미지는 일러스트 아트워크이고, 가격과 리뷰는 예시이며, 실제 주문·결제·계정은 처리되지
        않습니다.
      </p>
      <Link to="/shop/all" className="btn btn-primary" style={{ justifySelf: 'start' }}>
        컬렉션 보러가기
      </Link>
    </InfoPage>
  );
}

export function ShippingReturns() {
  return (
    <InfoPage title="배송 및 반품" intro="간편한 국내 배송과 무료 반품.">
      <h2>배송</h2>
      <ul>
        <li>기본 배송비 ₩3,000, 출고 후 영업일 기준 1~3일 소요.</li>
        <li>상품 금액(쿠폰 할인 전) ₩100,000 이상 주문 시 무료배송.</li>
        <li>평일 오후 2시 이전 주문은 당일 출고.</li>
        <li>제주 및 도서산간 지역은 1~2일 추가 소요될 수 있습니다.</li>
      </ul>
      <h2>반품 및 교환</h2>
      <ul>
        <li>수령 후 14일 이내, 택을 제거하지 않은 미착용 상품은 무료 반품.</li>
        <li>사이즈 교환은 재고가 있는 경우 무료.</li>
        <li>검수 후 영업일 기준 3~5일 이내 원래 결제 수단으로 환불.</li>
        <li>최종 세일 상품은 상품 페이지에 표시되며 반품이 불가합니다.</li>
      </ul>
      <p className="notice">데모 스토어: 실제 스토어를 가정한 정책 예시입니다. 실제 배송이나 반품은 진행되지 않습니다.</p>
    </InfoPage>
  );
}

const SIZE_TABLES: { key: CategorySlug[]; title: string; head: string[]; rows: string[][] }[] = [
  {
    key: ['outerwear', 'knitwear', 'tops', 'sets'],
    title: '상의 및 아우터 (cm)',
    head: ['사이즈', '가슴단면×2', '어깨', '소매', '추천 키'],
    rows: [
      ['S', '112', '50', '60', '168–174'],
      ['M', '118', '52', '62', '174–180'],
      ['L', '124', '54', '63', '180–185'],
      ['XL', '130', '56', '64', '185–190'],
    ],
  },
  {
    key: ['bottoms'],
    title: '하의 (cm)',
    head: ['사이즈', '허리', '엉덩이', '허벅지', '인심'],
    rows: [
      ['28', '72', '100', '32', '78'],
      ['30', '77', '104', '33', '79'],
      ['32', '82', '108', '34', '80'],
      ['34', '87', '112', '35', '81'],
      ['36', '92', '116', '36', '82'],
    ],
  },
  {
    key: ['shoes'],
    title: '신발',
    head: ['한국 (mm)', 'US', 'UK', 'EU'],
    rows: [
      ['250', '7', '6', '40'],
      ['260', '8', '7', '41'],
      ['270', '9', '8', '42'],
      ['280', '10', '9', '43'],
      ['290', '11', '10', '44'],
    ],
  },
];

export function SizeTables({ highlight }: { highlight?: CategorySlug }) {
  const tables = highlight ? [...SIZE_TABLES].sort((a, b) => Number(b.key.includes(highlight)) - Number(a.key.includes(highlight))) : SIZE_TABLES;
  return (
    <div className="stack">
      {tables.map((t) => (
        <div key={t.title} className="table-wrap">
          <table>
            <caption style={{ textAlign: 'left', fontWeight: 500, padding: '8px 0' }}>{t.title}</caption>
            <thead>
              <tr>
                {t.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r) => (
                <tr key={r[0]}>
                  {r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <p className="muted" style={{ fontSize: 13 }}>
        제품을 펼쳐 놓고 측정한 실측 기준입니다. 가방과 액세서리의 크기는 각 상품 페이지에 안내되어 있습니다.
      </p>
    </div>
  );
}

export function SizeGuide() {
  return (
    <InfoPage title="사이즈 가이드" intro="알맞은 핏을 고를 수 있도록 실측 사이즈를 안내합니다.">
      <p>상의와 아우터는 여유 있게 재단되었습니다. 딱 맞게 입고 싶다면 한 사이즈 작게 선택하세요. 하의는 평소 허리 사이즈를 추천합니다.</p>
      <SizeTables />
    </InfoPage>
  );
}

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (form.name.trim().length < 2) er.name = '이름을 입력해 주세요.';
    if (!isEmail(form.email)) er.email = '올바른 이메일을 입력해 주세요.';
    if (form.message.trim().length < 10) er.message = '문의 내용은 10자 이상 입력해 주세요.';
    setErrors(er);
    if (Object.keys(er).length) {
      document.getElementById(`contact-${Object.keys(er)[0]}`)?.focus();
      return;
    }
    setSent(true);
  }
  const aria = (k: string) => ({ id: `contact-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `contact-${k}-error` : undefined });
  return (
    <InfoPage title="고객센터" intro="사이즈, 주문, 상품에 대해 궁금한 점이 있으면 문의해 주세요.">
      <p>
        운영 시간: 평일 10:00–18:00. 이메일 <span className="link-underline">care@tookfit.example</span>. 영업일 기준 하루 이내 답변드립니다.
      </p>
      {sent ? (
        <p className="notice notice-success" role="status">
          {form.name}님, 문의가 접수되었습니다. (데모: 실제로 전송되지 않습니다.)
        </p>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          {(['name', 'email'] as const).map((k) => (
            <div key={k} className="field">
              <label htmlFor={`contact-${k}`}>{k === 'name' ? '이름' : '이메일'}</label>
              <input className="input" type={k === 'email' ? 'email' : 'text'} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...aria(k)} />
              {errors[k] && (
                <p id={`contact-${k}-error`} className="error-text">
                  {errors[k]}
                </p>
              )}
            </div>
          ))}
          <div className="field">
            <label htmlFor="contact-message">문의 내용</label>
            <textarea className="textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} {...aria('message')} />
            {errors.message && (
              <p id="contact-message-error" className="error-text">
                {errors.message}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>
            문의 보내기
          </button>
        </form>
      )}
    </InfoPage>
  );
}

const FAQS: [string, string][] = [
  ['실제 쇼핑몰인가요?', '아니요. 프론트엔드 데모입니다. 상품을 둘러보고, 장바구니에 담고, 시뮬레이션 결제까지 할 수 있지만 실제로 청구되거나 배송되지 않습니다.'],
  ['결제는 어떻게 테스트하나요?', '카드 번호 4242 4242 4242 4242, 미래의 유효기간, 아무 3자리 CVC를 입력하면 결제가 성공합니다. 4000 0000 0000 0002는 결제 거절을 보여줍니다. 카카오페이와 네이버페이는 시뮬레이션 승인 화면이 열립니다.'],
  ['할인 코드가 있나요?', 'TUK10을 입력하면 상품 금액의 10%, 최대 ₩20,000까지 할인됩니다.'],
  ['무료배송 조건은?', '기본 배송비는 ₩3,000이며 상품 금액이 ₩100,000 이상이면 무료입니다.'],
  ['사이즈는 어떻게 고르나요?', '상의와 아우터는 여유 있는 핏이라 딱 맞게 입으려면 한 사이즈 작게 고르세요. 하의는 평소 허리 사이즈를 추천합니다. 자세한 실측은 사이즈 가이드를 참고하세요.'],
  ['리뷰는 실제 리뷰인가요?', '아니요. 데모를 위해 생성한 예시 리뷰입니다. 로그인하면 직접 리뷰를 남길 수 있으며 이 브라우저에만 저장됩니다.'],
  ['내 정보는 어디에 저장되나요?', '장바구니, 위시리스트, 데모 로그인, 데모 주문, 작성한 리뷰는 이 브라우저의 로컬 스토리지에만 저장됩니다. 카드 정보는 저장되지 않습니다.'],
];

export function FAQ() {
  return (
    <InfoPage title="자주 묻는 질문" intro="TUK FIT 데모 스토어에 대한 질문과 답변.">
      <div className="faq">
        {FAQS.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </InfoPage>
  );
}

export function Privacy() {
  return (
    <InfoPage title="개인정보처리방침" intro="이 데모가 저장하는 정보와 절대 저장하지 않는 정보.">
      <h2>저장하는 정보</h2>
      <ul>
        <li>장바구니, 위시리스트, 최근 본 상품, 최근 검색어.</li>
        <li>데모 로그인 시 입력한 이름과 이메일.</li>
        <li>데모 주문 요약: 상품, 금액, 입력한 배송 정보, 결제 수단명(카드 끝 4자리만).</li>
        <li>로그인 후 작성한 리뷰.</li>
        <li>분석 예시용 익명 이벤트(예: 장바구니 담기). 브라우저 밖으로 전송되지 않습니다.</li>
      </ul>
      <h2>절대 저장하지 않는 정보</h2>
      <ul>
        <li>전체 카드 번호, 유효기간, CVC.</li>
        <li>비밀번호.</li>
      </ul>
      <h2>저장 위치</h2>
      <p>모든 데이터는 브라우저의 로컬 스토리지에만 저장되며 서버로 전송되지 않습니다. 브라우저의 사이트 데이터를 삭제하면 모두 지워집니다.</p>
      <p>샘플 정보만 사용해 주세요.</p>
    </InfoPage>
  );
}

export function Terms() {
  return (
    <InfoPage title="이용약관" intro="TUK FIT 데모 스토어 이용약관.">
      <ul>
        <li>이 사이트는 프론트엔드 데모입니다. 실제 매매 계약이 성립하지 않으며 상품이 제공되지 않습니다.</li>
        <li>결제, 계정, 재고, 주문은 시뮬레이션이며 실서비스 수준의 보안을 제공하지 않습니다.</li>
        <li>가격, 재고, 상품 정보, 리뷰는 예시입니다.</li>
        <li>상품 이미지는 이 데모를 위해 제작한 일러스트 아트워크입니다.</li>
        <li>실제 개인정보나 결제 정보를 입력하지 마세요.</li>
      </ul>
    </InfoPage>
  );
}
