import { describe, expect, it } from 'vitest';
import { processPayment } from '../lib/payment';
import { formatCardNumber, formatExpiry, validateCard, validateShipping } from '../lib/validation';

const validShipping = {
  fullName: 'Min Park',
  email: 'min@example.com',
  phone: '010-1234-5678',
  postalCode: '04524',
  address: '12 Sample-ro, Jung-gu',
  city: 'Seoul',
  note: '',
};

describe('checkout validation', () => {
  it('requires every shipping field and the terms checkbox', () => {
    const errors = validateShipping({ fullName: '', email: 'bad', phone: '123', postalCode: '12', address: '', city: '', note: '' }, false);
    expect(Object.keys(errors).sort()).toEqual(['address', 'city', 'email', 'fullName', 'phone', 'postalCode', 'terms']);
    expect(validateShipping(validShipping, true)).toEqual({});
  });

  it('validates and formats card input', () => {
    const now = new Date(2026, 9, 20);
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatExpiry('1229')).toBe('12/29');
    expect(validateCard({ number: '4242 4242 4242 4242', expiry: '12/29', cvc: '123', name: 'Min Park' }, now)).toEqual({});
    const e = validateCard({ number: '4242 4242 4242 4241', expiry: '01/20', cvc: '1', name: '' }, now);
    expect(Object.keys(e).sort()).toEqual(['cvc', 'expiry', 'name', 'number']);
    expect(validateCard({ number: '4242424242424242', expiry: '13/29', cvc: '123', name: 'A B' }, now).expiry).toMatch(/Month/);
  });

  it('simulates success and decline without network', async () => {
    const ok = await processPayment({ method: 'card', amount: 1000, cardNumber: '4242 4242 4242 4242' }, 0);
    expect(ok).toMatchObject({ ok: true, last4: '4242' });
    const declined = await processPayment({ method: 'card', amount: 1000, cardNumber: '4000 0000 0000 0002' }, 0);
    expect(declined.ok).toBe(false);
    expect(await processPayment({ method: 'kakaopay', amount: 1000 }, 0)).toMatchObject({ ok: true, label: 'Kakao Pay' });
  });
});
