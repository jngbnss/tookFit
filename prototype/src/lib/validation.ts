import type { ShippingDetails } from '../domain/types';

export type FieldErrors<T extends string> = Partial<Record<T, string>>;
export type ShippingField = keyof ShippingDetails | 'terms';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(v: string) {
  return EMAIL.test(v.trim());
}

export function validateShipping(s: ShippingDetails, agreed: boolean): FieldErrors<ShippingField> {
  const e: FieldErrors<ShippingField> = {};
  if (s.fullName.trim().length < 2) e.fullName = '이름을 입력해 주세요.';
  if (!isEmail(s.email)) e.email = '올바른 이메일을 입력해 주세요. 예: name@example.com';
  if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(s.phone.trim())) e.phone = '휴대폰 번호를 입력해 주세요. 예: 010-1234-5678';
  if (!/^\d{5}$/.test(s.postalCode.trim())) e.postalCode = '우편번호는 5자리 숫자입니다.';
  if (s.address.trim().length < 5) e.address = '주소를 입력해 주세요.';
  if (s.city.trim().length < 2) e.city = '시/도를 입력해 주세요.';
  if (!agreed) e.terms = '데모 이용약관에 동의해 주세요.';
  return e;
}

export interface CardInput {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export function digitsOnly(v: string) {
  return v.replace(/\D/g, '');
}

export function formatCardNumber(v: string) {
  return digitsOnly(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiry(v: string) {
  const d = digitsOnly(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

export function luhn(num: string) {
  const d = digitsOnly(num);
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return d.length > 0 && sum % 10 === 0;
}

export function validateCard(c: CardInput, now = new Date()): FieldErrors<keyof CardInput> {
  const e: FieldErrors<keyof CardInput> = {};
  const num = digitsOnly(c.number);
  if (num.length !== 16 || !luhn(num)) e.number = '올바른 16자리 카드 번호를 입력해 주세요. 예: 4242 4242 4242 4242';
  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry);
  if (!m) e.expiry = 'MM/YY 형식으로 입력해 주세요.';
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) e.expiry = '월은 01~12 사이여야 합니다.';
    else if (new Date(year, month, 0, 23, 59, 59) < now) e.expiry = '유효기간이 지난 카드입니다.';
  }
  if (!/^\d{3,4}$/.test(c.cvc)) e.cvc = 'CVC는 3~4자리 숫자입니다.';
  if (c.name.trim().length < 2) e.name = '카드 소유자 이름을 입력해 주세요.';
  return e;
}
