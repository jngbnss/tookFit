import type { PaymentMethod } from '../domain/types';
import { digitsOnly } from './validation';

export const DECLINE_CARD = '4000000000000002';
export const SUCCESS_CARD = '4242424242424242';

export type PaymentResult =
  | { ok: true; method: PaymentMethod; label: string; last4?: string; reference: string }
  | { ok: false; reason: string };

export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  /** Used only to decide the simulated outcome; never stored or sent anywhere. */
  cardNumber?: string;
}

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  card: '신용·체크카드',
  kakaopay: '카카오페이',
  naverpay: '네이버페이',
};

/** Mock payment gateway. Resolves locally after a short delay; makes no network calls. */
export function processPayment(req: PaymentRequest, delayMs = 1200): Promise<PaymentResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const reference = `PAY-${Date.now().toString(36).toUpperCase()}`;
      if (req.method === 'card') {
        const digits = digitsOnly(req.cardNumber ?? '');
        if (digits === DECLINE_CARD) {
          resolve({ ok: false, reason: '카드사에서 결제를 거절했습니다(시뮬레이션). 다른 카드를 사용해 주세요.' });
          return;
        }
        resolve({ ok: true, method: 'card', label: METHOD_LABELS.card, last4: digits.slice(-4), reference });
        return;
      }
      resolve({ ok: true, method: req.method, label: METHOD_LABELS[req.method], reference });
    }, delayMs);
  });
}

export function generateOrderNumber(now = new Date()): string {
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = Math.floor(Math.random() * 1e6).toString().padStart(6, '0');
  return `TF-${ymd}-${rand}`;
}
