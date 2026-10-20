import type { ShippingDetails } from '../domain/types';

export type FieldErrors<T extends string> = Partial<Record<T, string>>;
export type ShippingField = keyof ShippingDetails | 'terms';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(v: string) {
  return EMAIL.test(v.trim());
}

export function validateShipping(s: ShippingDetails, agreed: boolean): FieldErrors<ShippingField> {
  const e: FieldErrors<ShippingField> = {};
  if (s.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
  if (!isEmail(s.email)) e.email = 'Enter a valid email address, for example name@example.com.';
  if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(s.phone.trim())) e.phone = 'Enter a Korean phone number, for example 010-1234-5678.';
  if (!/^\d{5}$/.test(s.postalCode.trim())) e.postalCode = 'Postal code must be 5 digits.';
  if (s.address.trim().length < 5) e.address = 'Enter your street address.';
  if (s.city.trim().length < 2) e.city = 'Enter your city.';
  if (!agreed) e.terms = 'Please agree to the demo terms to continue.';
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
  if (num.length !== 16 || !luhn(num)) e.number = 'Enter a valid 16-digit card number. Try 4242 4242 4242 4242.';
  const m = /^(\d{2})\/(\d{2})$/.exec(c.expiry);
  if (!m) e.expiry = 'Use MM/YY format.';
  else {
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) e.expiry = 'Month must be between 01 and 12.';
    else if (new Date(year, month, 0, 23, 59, 59) < now) e.expiry = 'This card has expired.';
  }
  if (!/^\d{3,4}$/.test(c.cvc)) e.cvc = 'CVC must be 3 or 4 digits.';
  if (c.name.trim().length < 2) e.name = 'Enter the name on the card.';
  return e;
}
