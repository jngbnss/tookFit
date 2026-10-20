import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CategorySlug } from '../domain/types';
import { isEmail } from '../lib/validation';
import { usePageMeta } from '../components/usePageMeta';

function InfoPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  usePageMeta(title, intro);
  return (
    <div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link to="/">Home</Link>
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
    <InfoPage title="About" intro="T.O.O.K FIT is a modern menswear label shaped by Seoul winters.">
      <p>
        We started T.O.O.K FIT with a simple rule: <em>take only what you’ll keep</em>. Every season we design fewer pieces, choose better fabric, and refine
        shapes until they feel right for years rather than weeks.
      </p>
      <h2>How we design</h2>
      <p>
        Our silhouettes are relaxed but deliberate — dropped shoulders, long lines, and trousers with real volume. The palette stays quiet: black,
        charcoal, cream, brown, navy, and olive, so everything in your wardrobe works together.
      </p>
      <h2>How we make</h2>
      <ul>
        <li>Wool and cashmere from established Italian and Japanese mills.</li>
        <li>Knitwear produced in small runs with partner workshops in Korea.</li>
        <li>Down certified to the Responsible Down Standard.</li>
        <li>Recycled nylon and polyester wherever performance allows.</li>
      </ul>
      <h2>About this site</h2>
      <p>
        This website is a frontend demonstration of the T.O.O.K FIT store. Product imagery is illustrative studio artwork, prices are examples, and no
        orders, payments, or accounts are processed.
      </p>
      <Link to="/shop/all" className="btn btn-primary" style={{ justifySelf: 'start' }}>
        Shop the collection
      </Link>
    </InfoPage>
  );
}

export function ShippingReturns() {
  return (
    <InfoPage title="Shipping & Returns" intro="Simple delivery and free returns within Korea.">
      <h2>Shipping</h2>
      <ul>
        <li>Standard delivery: ₩3,000, 1–3 business days after dispatch.</li>
        <li>Free standard delivery on orders of ₩100,000 or more (merchandise subtotal, before coupon discounts).</li>
        <li>Orders placed before 2 p.m. KST on business days are dispatched the same day.</li>
        <li>Jeju and island regions may take 1–2 additional days.</li>
      </ul>
      <h2>Returns &amp; exchanges</h2>
      <ul>
        <li>Free returns within 14 days of delivery for unworn items with tags attached.</li>
        <li>Exchanges for a different size are free, subject to availability.</li>
        <li>Refunds are issued to the original payment method within 3–5 business days of inspection.</li>
        <li>Final-sale items are marked on the product page and cannot be returned.</li>
      </ul>
      <p className="notice">Demo store: these policies illustrate a real storefront. No items are shipped or returned.</p>
    </InfoPage>
  );
}

const SIZE_TABLES: { key: CategorySlug[]; title: string; head: string[]; rows: string[][] }[] = [
  {
    key: ['outerwear', 'knitwear', 'tops', 'sets'],
    title: 'Tops & outerwear (cm)',
    head: ['Size', 'Chest', 'Shoulder', 'Sleeve', 'Fits height'],
    rows: [
      ['S', '112', '50', '60', '168–174'],
      ['M', '118', '52', '62', '174–180'],
      ['L', '124', '54', '63', '180–185'],
      ['XL', '130', '56', '64', '185–190'],
    ],
  },
  {
    key: ['bottoms'],
    title: 'Bottoms (cm)',
    head: ['Size', 'Waist', 'Hip', 'Thigh', 'Inseam'],
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
    title: 'Shoes',
    head: ['Korea (mm)', 'US', 'UK', 'EU'],
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
        Measurements are of the garment laid flat and doubled where relevant. Bags and accessories list their dimensions on each product page.
      </p>
    </div>
  );
}

export function SizeGuide() {
  return (
    <InfoPage title="Size Guide" intro="Garment measurements to help you choose the right fit.">
      <p>Our tops and outerwear are cut relaxed. If you prefer a closer fit, size down. Trousers are true to waist size.</p>
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
    if (form.name.trim().length < 2) er.name = 'Enter your name.';
    if (!isEmail(form.email)) er.email = 'Enter a valid email address.';
    if (form.message.trim().length < 10) er.message = 'Message must be at least 10 characters.';
    setErrors(er);
    if (Object.keys(er).length) {
      document.getElementById(`contact-${Object.keys(er)[0]}`)?.focus();
      return;
    }
    setSent(true);
  }
  const aria = (k: string) => ({ id: `contact-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `contact-${k}-error` : undefined });
  return (
    <InfoPage title="Contact" intro="Questions about sizing, an order, or a product? We’re here to help.">
      <p>
        Customer care: Monday–Friday, 10:00–18:00 KST. Email <span className="link-underline">care@tookfit.example</span>. Typical response within one
        business day.
      </p>
      {sent ? (
        <p className="notice notice-success" role="status">
          Thanks, {form.name.split(' ')[0]} — your message has been received. (Demo: nothing was sent.)
        </p>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          {(['name', 'email'] as const).map((k) => (
            <div key={k} className="field">
              <label htmlFor={`contact-${k}`}>{k === 'name' ? 'Name' : 'Email'}</label>
              <input className="input" type={k === 'email' ? 'email' : 'text'} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...aria(k)} />
              {errors[k] && (
                <p id={`contact-${k}-error`} className="error-text">
                  {errors[k]}
                </p>
              )}
            </div>
          ))}
          <div className="field">
            <label htmlFor="contact-message">Message</label>
            <textarea className="textarea" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} {...aria('message')} />
            {errors.message && (
              <p id="contact-message-error" className="error-text">
                {errors.message}
              </p>
            )}
          </div>
          <button type="submit" className="btn btn-primary" style={{ justifySelf: 'start' }}>
            Send message
          </button>
        </form>
      )}
    </InfoPage>
  );
}

const FAQS: [string, string][] = [
  ['Is this a real store?', 'No. This is a frontend demonstration. You can browse, add to bag, and complete a simulated checkout, but nothing is charged or shipped.'],
  ['How do I test checkout?', 'Use card 4242 4242 4242 4242 with any future expiry and any 3-digit CVC for a successful payment, or 4000 0000 0000 0002 to see a declined payment. Kakao Pay and Naver Pay open simulated confirmation screens.'],
  ['Is there a discount code?', 'Yes — TOOK10 takes 10% off your merchandise subtotal, up to ₩20,000.'],
  ['When is shipping free?', 'Standard shipping is ₩3,000 and free when your merchandise subtotal is ₩100,000 or more.'],
  ['How do your sizes run?', 'Tops and outerwear are cut relaxed; size down for a closer fit. Trousers are true to waist size. See the Size Guide for measurements.'],
  ['Where is my data stored?', 'Your bag, wishlist, demo sign-in, and demo orders are stored only in this browser’s local storage. Card details are never stored.'],
];

export function FAQ() {
  return (
    <InfoPage title="FAQ" intro="Answers to common questions about the T.O.O.K FIT demo store.">
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
    <InfoPage title="Privacy" intro="What this demo stores, and what it never does.">
      <h2>What we store</h2>
      <ul>
        <li>Bag contents, wishlist, recently viewed products, and recent searches.</li>
        <li>A demo display name and email if you use the simulated sign-in.</li>
        <li>Demo order summaries: items, totals, shipping details you entered, and payment method name (with only the last four card digits).</li>
        <li>Local, anonymous interaction events (such as “add to cart”) used to illustrate analytics. These never leave your browser.</li>
      </ul>
      <h2>What we never store</h2>
      <ul>
        <li>Full card numbers, expiry dates, or security codes.</li>
        <li>Passwords.</li>
      </ul>
      <h2>Where it lives</h2>
      <p>All data stays in your browser’s local storage. Nothing is sent to a server. Clear your browser’s site data to remove it.</p>
      <p>Please use sample information only.</p>
    </InfoPage>
  );
}

export function Terms() {
  return (
    <InfoPage title="Terms" intro="Terms of use for the T.O.O.K FIT demonstration store.">
      <ul>
        <li>This site is a frontend demonstration. No contract of sale is formed and no goods are supplied.</li>
        <li>Payments, accounts, inventory, and orders are simulated and provide no production-grade security.</li>
        <li>Prices, stock levels, and product details are illustrative examples.</li>
        <li>Product imagery is original illustrative artwork created for this demo.</li>
        <li>Do not enter real personal or payment information.</li>
      </ul>
    </InfoPage>
  );
}
