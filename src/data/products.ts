import type { Badge, CategorySlug, ColorOption, Product } from '../domain/types';

const C = {
  black: { id: 'black', name: 'Black', hex: '#1c1c1e' },
  charcoal: { id: 'charcoal', name: 'Charcoal', hex: '#3e3f42' },
  gray: { id: 'gray', name: 'Heather Gray', hex: '#8c8c8a' },
  cream: { id: 'cream', name: 'Cream', hex: '#e2dac8' },
  white: { id: 'white', name: 'Off White', hex: '#eeece6' },
  camel: { id: 'camel', name: 'Camel', hex: '#b0885c' },
  brown: { id: 'brown', name: 'Brown', hex: '#684a34' },
  sand: { id: 'sand', name: 'Sand', hex: '#c4b292' },
  navy: { id: 'navy', name: 'Navy', hex: '#28324a' },
  olive: { id: 'olive', name: 'Muted Olive', hex: '#5c6042' },
  blue: { id: 'blue', name: 'Pale Blue', hex: '#96acc6' },
  denim: { id: 'denim', name: 'Mid Blue', hex: '#4e6280' },
  washedBlack: { id: 'washed-black', name: 'Washed Black', hex: '#38383c' },
} satisfies Record<string, ColorOption>;

export const ALL_COLORS: ColorOption[] = Object.values(C);

const SIZES = {
  apparel: ['S', 'M', 'L', 'XL'],
  bottoms: ['28', '30', '32', '34', '36'],
  shoes: ['250', '260', '270', '280', '290'],
};

export const ALL_SIZES = [...SIZES.apparel, ...SIZES.bottoms, ...SIZES.shoes, 'Standard', 'Large', 'Long', 'S/M', 'L/XL'];

const SHIPPING_STANDARD =
  'Ships within 1–2 business days from Seoul. Standard delivery ₩3,000, free on orders of ₩100,000 or more. Free returns within 14 days of delivery.';

/** Deterministic stock so tests and the UI agree across reloads. */
function seededStock(id: string, colors: ColorOption[], sizes: string[]) {
  const stock: Record<string, Record<string, number>> = {};
  colors.forEach((color, ci) => {
    stock[color.id] = {};
    sizes.forEach((size, si) => {
      let h = 0;
      for (const ch of `${id}:${color.id}:${size}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      // The last size of the last color is always sold out, a few others run low.
      const last = ci === colors.length - 1 && si === sizes.length - 1;
      stock[color.id][size] = last ? 0 : h % 11 === 0 ? 0 : h % 5 === 0 ? 2 : 4 + (h % 9);
    });
  });
  return stock;
}

interface Seed {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: Badge;
  colors: ColorOption[];
  sizes: string[];
  material: string;
  fit: string;
  care: string[];
  relatedIds: string[];
  createdAt: string;
  view: string;
}

function build(seed: Seed, rank: number): Product {
  const { view, ...rest } = seed;
  const [first, second] = seed.colors;
  return {
    ...rest,
    featuredRank: rank,
    stock: seededStock(seed.id, seed.colors, seed.sizes),
    shipping: SHIPPING_STANDARD,
    images: [
      {
        src: `images/products/${seed.slug}-01.webp`,
        alt: `${seed.name} in ${first.name}, ${view}`,
      },
      {
        src: `images/products/${seed.slug}-02.webp`,
        alt: `${seed.name} in ${second.name}, close studio view showing fabric and construction`,
      },
    ],
  };
}

const KNIT_CARE = ['Hand wash cold or dry clean', 'Dry flat in shape', 'Store folded, not hung', 'Do not tumble dry'];
const WOOL_CARE = ['Dry clean only', 'Brush after wear', 'Hang on a wide shoulder hanger', 'Steam to remove creases'];
const COTTON_CARE = ['Machine wash cold, inside out', 'Wash with similar colors', 'Tumble dry low or line dry', 'Warm iron if needed'];
const LEATHER_CARE = ['Specialist leather clean only', 'Keep away from direct heat', 'Condition twice a season', 'Store on a padded hanger'];

const seeds: Seed[] = [
  // OUTERWEAR
  {
    id: 'tf-ow-01', slug: 'ardent-wool-overcoat', name: 'Ardent Wool Overcoat', category: 'outerwear',
    description: 'A long single-breasted overcoat cut from a dense Italian wool-cashmere blend. Dropped shoulders and a clean notch lapel keep the line relaxed, while a full cupro lining lets it slide easily over heavy knitwear. Two hidden buttons, deep welt pockets, and a single back vent.',
    price: 389000, badge: 'NEW', colors: [C.black, C.camel, C.charcoal], sizes: SIZES.apparel,
    material: '80% wool, 20% cashmere. Lining: 100% cupro.',
    fit: 'Relaxed fit with dropped shoulders. Falls below the knee on a 182 cm model. Take your usual size for room over knitwear.',
    care: WOOL_CARE, relatedIds: ['tf-kn-01', 'tf-bt-01', 'tf-sh-03', 'tf-ac-01'], createdAt: '2026-10-12',
    view: 'flat-lay on a warm stone studio backdrop',
  },
  {
    id: 'tf-ow-02', slug: 'northline-down-puffer', name: 'Northline Down Puffer', category: 'outerwear',
    description: 'A boxy, mid-length puffer filled with responsibly sourced 80/20 duck down. The matte recycled-nylon shell resists light rain and wind, and wide horizontal baffles give a calm, architectural shape. Two-way zip, storm flap, and fleece-lined hand pockets.',
    price: 329000, originalPrice: 369000, badge: 'BEST', colors: [C.black, C.olive, C.navy], sizes: SIZES.apparel,
    material: 'Shell: 100% recycled nylon. Fill: 80% duck down, 20% feather (RDS certified).',
    fit: 'Boxy and slightly cropped at the hip. Size down for a closer fit.',
    care: ['Machine wash cold on a gentle cycle', 'Tumble dry low with dryer balls', 'Do not dry clean', 'Store uncompressed'],
    relatedIds: ['tf-kn-04', 'tf-bt-03', 'tf-sh-02', 'tf-ac-02'], createdAt: '2026-09-28',
    view: 'flat-lay showing the wide quilted baffles',
  },
  {
    id: 'tf-ow-03', slug: 'meridian-leather-bomber', name: 'Meridian Leather Bomber', category: 'outerwear',
    description: 'A soft lambskin bomber with a vegetable-tanned finish that softens and gains character with wear. Ribbed collar, cuffs, and hem in a heavy merino rib, a two-way brass zip, and a quilted lining for warmth without bulk.',
    price: 459000, badge: 'LIMITED', colors: [C.black, C.brown], sizes: SIZES.apparel,
    material: '100% lambskin leather. Rib: 100% merino wool. Lining: 100% polyester quilt.',
    fit: 'Regular fit that sits at the waist. True to size.',
    care: LEATHER_CARE, relatedIds: ['tf-tp-02', 'tf-bt-04', 'tf-sh-03', 'tf-bg-01'], createdAt: '2026-10-05',
    view: 'flat-lay highlighting the leather sheen and ribbed hem',
  },
  {
    id: 'tf-ow-04', slug: 'sable-suede-blouson', name: 'Sable Suede Blouson', category: 'outerwear',
    description: 'A short goat-suede blouson with a spread collar and press-stud placket. The brushed nap has a soft, matte depth that pairs naturally with denim and knitwear. Adjustable side tabs let you cinch the hem.',
    price: 349000, originalPrice: 419000, badge: 'SALE', colors: [C.brown, C.sand, C.olive], sizes: SIZES.apparel,
    material: '100% goat suede. Lining: 100% cotton twill.',
    fit: 'Relaxed through the body, cropped at the waist.',
    care: ['Suede specialist clean only', 'Brush with a suede brush', 'Treat with water repellent before wear', 'Avoid heavy rain'],
    relatedIds: ['tf-kn-02', 'tf-bt-04', 'tf-sh-01', 'tf-ac-01'], createdAt: '2026-08-30',
    view: 'flat-lay showing the spread collar and snap placket',
  },
  {
    id: 'tf-ow-05', slug: 'fieldwork-quilted-jacket', name: 'Fieldwork Quilted Jacket', category: 'outerwear',
    description: 'A lightweight diamond-quilted jacket with a corduroy collar, designed as a layer under a coat or on its own through early winter. Recycled polyester padding keeps it warm and packable.',
    price: 219000, badge: 'NEW', colors: [C.olive, C.navy, C.black], sizes: SIZES.apparel,
    material: 'Shell: 100% recycled nylon. Padding: 100% recycled polyester. Collar: cotton corduroy.',
    fit: 'Regular fit, hip length. Room for a sweater underneath.',
    care: COTTON_CARE, relatedIds: ['tf-tp-05', 'tf-bt-02', 'tf-sh-02', 'tf-bg-01'], createdAt: '2026-10-08',
    view: 'flat-lay showing the diamond quilting',
  },
  {
    id: 'tf-ow-06', slug: 'stratus-technical-parka', name: 'Stratus Technical Parka', category: 'outerwear',
    description: 'A three-layer waterproof parka with fully taped seams and a structured, helmet-compatible hood. The matte face fabric and hidden hardware keep it quiet enough for the city. Bellow pockets, interior media pocket, and adjustable cuffs.',
    price: 399000, badge: 'BEST', colors: [C.charcoal, C.olive, C.black], sizes: SIZES.apparel,
    material: '3-layer recycled polyester with waterproof membrane (20,000 mm). Lining: brushed tricot.',
    fit: 'Oversized fit with a longer back hem. Take your usual size.',
    care: ['Machine wash cold, close all zips', 'Tumble dry low to reactivate DWR', 'Do not use fabric softener', 'Do not dry clean'],
    relatedIds: ['tf-kn-04', 'tf-bt-03', 'tf-sh-02', 'tf-ac-02'], createdAt: '2026-09-15',
    view: 'flat-lay with hood raised',
  },
  // KNITWEAR
  {
    id: 'tf-kn-01', slug: 'harbor-cable-knit-sweater', name: 'Harbor Cable-Knit Sweater', category: 'knitwear',
    description: 'A heavyweight fisherman sweater knitted in undyed lambswool with a central cable panel and honeycomb texture. Saddle shoulders and a slightly dropped armhole make it easy to layer under outerwear.',
    price: 169000, badge: 'BEST', colors: [C.cream, C.navy, C.charcoal], sizes: SIZES.apparel,
    material: '100% lambswool, 5-gauge knit.',
    fit: 'Relaxed fit, hip length. Size down for a neater fit.',
    care: KNIT_CARE, relatedIds: ['tf-ow-01', 'tf-bt-02', 'tf-ac-02', 'tf-sh-03'], createdAt: '2026-09-20',
    view: 'folded flat-lay showing the cable pattern',
  },
  {
    id: 'tf-kn-02', slug: 'linea-mock-neck-knit', name: 'Linea Mock-Neck Knit', category: 'knitwear',
    description: 'A fine-gauge merino mock neck with a clean, fully fashioned body. Light enough to wear under a blazer, warm enough for a cold commute. The low collar sits close without feeling tight.',
    price: 129000, badge: 'NEW', colors: [C.black, C.cream, C.gray], sizes: SIZES.apparel,
    material: '100% extra-fine merino wool, 14-gauge.',
    fit: 'Slim through the body with a regular sleeve. True to size.',
    care: KNIT_CARE, relatedIds: ['tf-ow-04', 'tf-st-03', 'tf-bt-01', 'tf-sh-01'], createdAt: '2026-10-14',
    view: 'flat-lay on a light studio backdrop',
  },
  {
    id: 'tf-kn-03', slug: 'atelier-shawl-cardigan', name: 'Atelier Shawl Cardigan', category: 'knitwear',
    description: 'A chunky shawl-collar cardigan in a soft wool-alpaca blend. Corozo buttons and patch pockets give it a lived-in, considered feel. Wear it as a light jacket indoors or under an overcoat.',
    price: 189000, originalPrice: 219000, badge: 'SALE', colors: [C.brown, C.charcoal], sizes: SIZES.apparel,
    material: '60% wool, 30% alpaca, 10% nylon. Corozo nut buttons.',
    fit: 'Relaxed fit, hip length.',
    care: KNIT_CARE, relatedIds: ['tf-tp-03', 'tf-bt-02', 'tf-ac-01', 'tf-kn-05'], createdAt: '2026-08-25',
    view: 'flat-lay showing the shawl collar and buttons',
  },
  {
    id: 'tf-kn-04', slug: 'ridge-half-zip-knit', name: 'Ridge Half-Zip Knit', category: 'knitwear',
    description: 'A ribbed half-zip in a merino-cotton blend that regulates temperature well on transit days. Funnel collar, a matte metal zip, and ribbed cuffs that hold their shape.',
    price: 149000, colors: [C.navy, C.gray, C.olive], sizes: SIZES.apparel,
    material: '70% merino wool, 30% cotton.',
    fit: 'Regular fit. True to size.',
    care: KNIT_CARE, relatedIds: ['tf-ow-02', 'tf-bt-03', 'tf-sh-02', 'tf-ac-02'], createdAt: '2026-09-02',
    view: 'flat-lay with collar zipped',
  },
  {
    id: 'tf-kn-05', slug: 'loft-brushed-mohair-crew', name: 'Loft Brushed Mohair Crew', category: 'knitwear',
    description: 'An airy, brushed mohair crewneck with a soft halo and surprising warmth for its weight. The open knit shows a little texture from the shirt beneath — a quiet, tactile layer.',
    price: 179000, badge: 'LIMITED', colors: [C.gray, C.cream, C.brown], sizes: SIZES.apparel,
    material: '55% mohair, 25% wool, 20% polyamide.',
    fit: 'Oversized with dropped shoulders.',
    care: KNIT_CARE, relatedIds: ['tf-tp-03', 'tf-bt-01', 'tf-ow-01', 'tf-sh-01'], createdAt: '2026-10-02',
    view: 'flat-lay showing the brushed texture',
  },
  // TOPS
  {
    id: 'tf-tp-01', slug: 'base-heavyweight-sweatshirt', name: 'Base Heavyweight Sweatshirt', category: 'tops',
    description: 'A 480 gsm loopback sweatshirt that keeps its shape wash after wash. Boxy body, raglan-free shoulder, and a wide ribbed hem. The essential cold-weather base layer.',
    price: 89000, badge: 'BEST', colors: [C.gray, C.black, C.cream], sizes: SIZES.apparel,
    material: '100% organic cotton loopback, 480 gsm.',
    fit: 'Boxy, slightly cropped. Take your usual size.',
    care: COTTON_CARE, relatedIds: ['tf-bt-05', 'tf-sh-02', 'tf-ac-02', 'tf-ow-02'], createdAt: '2026-08-18',
    view: 'flat-lay on a pale studio backdrop',
  },
  {
    id: 'tf-tp-02', slug: 'studio-long-sleeve-tee', name: 'Studio Long-Sleeve Tee', category: 'tops',
    description: 'A dense, compact-jersey long-sleeve tee with a narrow collar that never loses its shape. Built as the quiet layer under every shirt, knit, and coat this season.',
    price: 49000, colors: [C.white, C.charcoal, C.black], sizes: SIZES.apparel,
    material: '100% combed cotton jersey, 240 gsm.',
    fit: 'Regular fit, slightly longer sleeve.',
    care: COTTON_CARE, relatedIds: ['tf-ow-03', 'tf-bt-04', 'tf-kn-02', 'tf-sh-02'], createdAt: '2026-07-30',
    view: 'flat-lay',
  },
  {
    id: 'tf-tp-03', slug: 'campus-oxford-shirt', name: 'Campus Oxford Shirt', category: 'tops',
    description: 'A button-down Oxford shirt in a soft, garment-washed cotton. Generous collar roll, a single chest pocket, and a curved hem that works tucked or untucked.',
    price: 99000, badge: 'NEW', colors: [C.blue, C.white, C.cream], sizes: SIZES.apparel,
    material: '100% cotton Oxford cloth.',
    fit: 'Relaxed fit. True to size.',
    care: COTTON_CARE, relatedIds: ['tf-kn-03', 'tf-bt-06', 'tf-sh-01', 'tf-kn-05'], createdAt: '2026-10-10',
    view: 'flat-lay showing the button-down collar',
  },
  {
    id: 'tf-tp-04', slug: 'quarry-flannel-overshirt', name: 'Quarry Flannel Overshirt', category: 'tops',
    description: 'A brushed cotton-wool flannel overshirt in a tonal check. Two flap chest pockets and a heavier weight let it work as a shirt-jacket through mild winter days.',
    price: 119000, originalPrice: 139000, badge: 'SALE', colors: [C.brown, C.olive, C.charcoal], sizes: SIZES.apparel,
    material: '80% cotton, 20% wool brushed flannel.',
    fit: 'Relaxed fit with room for a tee or thin knit underneath.',
    care: COTTON_CARE, relatedIds: ['tf-ow-05', 'tf-bt-03', 'tf-ac-02', 'tf-sh-03'], createdAt: '2026-08-12',
    view: 'flat-lay showing the tonal check',
  },
  {
    id: 'tf-tp-05', slug: 'echo-waffle-henley', name: 'Echo Waffle Henley', category: 'tops',
    description: 'A thermal waffle-knit henley with a three-button placket and a slightly longer body. Breathable warmth for layering under quilted jackets and overshirts.',
    price: 69000, colors: [C.cream, C.charcoal, C.olive], sizes: SIZES.apparel,
    material: '100% cotton waffle knit.',
    fit: 'Regular fit. True to size.',
    care: COTTON_CARE, relatedIds: ['tf-ow-05', 'tf-bt-04', 'tf-kn-03', 'tf-ac-02'], createdAt: '2026-09-05',
    view: 'flat-lay showing the waffle texture',
  },
  // BOTTOMS
  {
    id: 'tf-bt-01', slug: 'avenue-wide-wool-trousers', name: 'Avenue Wide Wool Trousers', category: 'bottoms',
    description: 'Double-pleated wide trousers in a fluid wool flannel. A high rise and pressed creases give a long, unbroken line that drapes beautifully over boots and derbies.',
    price: 179000, badge: 'BEST', colors: [C.charcoal, C.brown, C.black], sizes: SIZES.bottoms,
    material: '100% wool flannel. Pocketing: cotton.',
    fit: 'Wide leg with a high rise. Inseam 80 cm, unfinished-length alterations available in store.',
    care: WOOL_CARE, relatedIds: ['tf-ow-01', 'tf-kn-02', 'tf-sh-01', 'tf-kn-05'], createdAt: '2026-09-12',
    view: 'flat-lay showing pressed creases',
  },
  {
    id: 'tf-bt-02', slug: 'harlow-corduroy-pants', name: 'Harlow Corduroy Pants', category: 'bottoms',
    description: 'Eight-wale cotton corduroy pants with a relaxed straight leg. Soft from the first wear, with a single pleat for comfort through the hip.',
    price: 129000, colors: [C.brown, C.cream, C.navy], sizes: SIZES.bottoms,
    material: '100% cotton corduroy, 8-wale.',
    fit: 'Relaxed straight leg, mid rise.',
    care: COTTON_CARE, relatedIds: ['tf-kn-01', 'tf-ow-05', 'tf-sh-03', 'tf-kn-03'], createdAt: '2026-08-22',
    view: 'flat-lay showing the corduroy wale',
  },
  {
    id: 'tf-bt-03', slug: 'terrain-cargo-pants', name: 'Terrain Cargo Pants', category: 'bottoms',
    description: 'Utility cargo pants in a water-repellent ripstop with low-profile bellow pockets. A tapered hem with adjustable cuffs keeps the volume in check.',
    price: 139000, badge: 'NEW', colors: [C.olive, C.black, C.sand], sizes: SIZES.bottoms,
    material: '100% cotton ripstop with DWR finish.',
    fit: 'Relaxed through the thigh, tapered at the ankle.',
    care: COTTON_CARE, relatedIds: ['tf-ow-06', 'tf-kn-04', 'tf-sh-02', 'tf-bg-01'], createdAt: '2026-10-09',
    view: 'flat-lay showing the cargo pockets',
  },
  {
    id: 'tf-bt-04', slug: 'ash-washed-denim', name: 'Ash Washed Denim', category: 'bottoms',
    description: '13.5 oz Japanese denim with a soft, vintage-style wash and a straight, slightly wide leg. Copper rivets, a button fly, and contrast tobacco stitching.',
    price: 149000, colors: [C.washedBlack, C.denim], sizes: SIZES.bottoms,
    material: '100% cotton Japanese denim, 13.5 oz.',
    fit: 'Straight, slightly wide leg with a mid rise. True to waist size.',
    care: ['Wash inside out, cold', 'Wash sparingly to keep the color', 'Line dry', 'Do not bleach'],
    relatedIds: ['tf-ow-03', 'tf-tp-02', 'tf-sh-02', 'tf-ow-04'], createdAt: '2026-07-25',
    view: 'flat-lay showing the washed finish',
  },
  {
    id: 'tf-bt-05', slug: 'rest-fleece-sweatpants', name: 'Rest Fleece Sweatpants', category: 'bottoms',
    description: 'Brushed-back fleece sweatpants with a wide waistband, hidden drawcord, and gently tapered leg. Built to match the Base Heavyweight Sweatshirt.',
    price: 79000, originalPrice: 99000, badge: 'SALE', colors: [C.gray, C.navy, C.black], sizes: SIZES.bottoms,
    material: '100% organic cotton brushed fleece, 420 gsm.',
    fit: 'Relaxed through the thigh with a tapered cuff.',
    care: COTTON_CARE, relatedIds: ['tf-tp-01', 'tf-sh-02', 'tf-ac-02', 'tf-ow-02'], createdAt: '2026-08-05',
    view: 'flat-lay showing the drawcord waist',
  },
  {
    id: 'tf-bt-06', slug: 'pleat-tapered-chinos', name: 'Pleat Tapered Chinos', category: 'bottoms',
    description: 'Single-pleat chinos in a dense brushed twill. The tapered leg and clean finish make them an easy alternative to wool trousers on the weekend.',
    price: 119000, colors: [C.sand, C.navy, C.black], sizes: SIZES.bottoms,
    material: '98% cotton, 2% elastane brushed twill.',
    fit: 'Tapered leg, mid rise. True to waist size.',
    care: COTTON_CARE, relatedIds: ['tf-tp-03', 'tf-kn-02', 'tf-sh-01', 'tf-ow-04'], createdAt: '2026-09-25',
    view: 'flat-lay',
  },
  // SETS
  {
    id: 'tf-st-01', slug: 'hearth-knit-lounge-set', name: 'Hearth Knit Lounge Set', category: 'sets',
    description: 'A matching ribbed crew and knit trouser in a soft wool-cotton blend. Wear them together at home or split them up across the week.',
    price: 229000, badge: 'LIMITED', colors: [C.cream, C.gray], sizes: SIZES.apparel,
    material: '50% wool, 50% cotton rib knit.',
    fit: 'Relaxed crew and straight-leg trouser with elastic waist.',
    care: KNIT_CARE, relatedIds: ['tf-ac-02', 'tf-sh-02', 'tf-kn-05', 'tf-ac-01'], createdAt: '2026-10-01',
    view: 'flat-lay of top and trousers together',
  },
  {
    id: 'tf-st-02', slug: 'transit-tracksuit-set', name: 'Transit Tracksuit Set', category: 'sets',
    description: 'A refined tracksuit in a matte double-knit with contrast piping. The zip jacket and tapered pants are cut close enough to wear out with a coat over the top.',
    price: 199000, badge: 'NEW', colors: [C.black, C.navy], sizes: SIZES.apparel,
    material: '88% polyester, 12% elastane double knit.',
    fit: 'Regular jacket, tapered pants. True to size.',
    care: COTTON_CARE, relatedIds: ['tf-sh-02', 'tf-ow-02', 'tf-bg-01', 'tf-ac-02'], createdAt: '2026-10-15',
    view: 'flat-lay of jacket and pants with contrast piping',
  },
  {
    id: 'tf-st-03', slug: 'column-flannel-two-piece', name: 'Column Flannel Two-Piece', category: 'sets',
    description: 'An unstructured single-breasted jacket and matching pleated trouser in a soft wool flannel. Minimal shoulder padding and a patch-pocket jacket for an easy, modern suit.',
    price: 489000, colors: [C.charcoal, C.navy], sizes: SIZES.apparel,
    material: '100% wool flannel. Half lining: cupro.',
    fit: 'Relaxed jacket, wide trouser. Sold as a set in matching sizes.',
    care: WOOL_CARE, relatedIds: ['tf-kn-02', 'tf-sh-01', 'tf-ac-01', 'tf-tp-03'], createdAt: '2026-09-18',
    view: 'flat-lay of jacket and trousers together',
  },
  // SHOES
  {
    id: 'tf-sh-01', slug: 'clerk-leather-derby', name: 'Clerk Leather Derby', category: 'shoes',
    description: 'A rounded-toe derby in polished calf leather on a lightweight rubber sole. Goodyear welted, so it can be resoled for years.',
    price: 259000, colors: [C.black, C.brown], sizes: SIZES.shoes,
    material: 'Upper: calf leather. Lining: leather. Sole: rubber, Goodyear welted.',
    fit: 'True to size. Sizes in millimetres (Korean sizing).',
    care: ['Wipe clean with a dry cloth', 'Polish with neutral cream', 'Use cedar shoe trees', 'Allow to rest a day between wears'],
    relatedIds: ['tf-bt-01', 'tf-st-03', 'tf-kn-02', 'tf-bt-06'], createdAt: '2026-08-15',
    view: 'side-profile studio view of the pair',
  },
  {
    id: 'tf-sh-02', slug: 'frost-winter-sneaker', name: 'Frost Winter Sneaker', category: 'shoes',
    description: 'A clean leather sneaker with a shearling-lined collar and a grippy, siped rubber sole made for icy pavements.',
    price: 189000, badge: 'BEST', colors: [C.cream, C.black, C.gray], sizes: SIZES.shoes,
    material: 'Upper: leather. Lining: shearling. Sole: natural rubber.',
    fit: 'True to size. Half sizes should size up.',
    care: ['Wipe clean with a damp cloth', 'Treat with water repellent', 'Air dry away from heat'],
    relatedIds: ['tf-tp-01', 'tf-bt-05', 'tf-ow-02', 'tf-st-02'], createdAt: '2026-09-30',
    view: 'side-profile studio view of the pair',
  },
  {
    id: 'tf-sh-03', slug: 'moor-chelsea-boots', name: 'Moor Chelsea Boots', category: 'shoes',
    description: 'Chelsea boots with a slim almond toe, wide elastic gussets, and a commando-tread rubber sole. Waxed leather that handles slush without fuss.',
    price: 289000, badge: 'NEW', colors: [C.black, C.brown], sizes: SIZES.shoes,
    material: 'Upper: waxed calf leather. Sole: commando rubber.',
    fit: 'True to size. Sizes in millimetres (Korean sizing).',
    care: ['Brush off dirt after wear', 'Re-wax monthly in winter', 'Use cedar shoe trees'],
    relatedIds: ['tf-ow-01', 'tf-bt-01', 'tf-ow-03', 'tf-bt-04'], createdAt: '2026-10-11',
    view: 'side-profile studio view of the pair',
  },
  // BAGS
  {
    id: 'tf-bg-01', slug: 'commute-nylon-crossbody', name: 'Commute Nylon Crossbody', category: 'bags',
    description: 'A compact crossbody in a dense ballistic nylon with a magnetic buckle and an adjustable webbing strap. Fits a phone, wallet, and small notebook.',
    price: 129000, colors: [C.black, C.olive], sizes: ['Standard', 'Large'],
    material: '100% recycled ballistic nylon. Aluminium hardware.',
    fit: 'Standard: 24 × 16 × 7 cm. Large: 30 × 20 × 9 cm. Strap adjusts 70–130 cm.',
    care: ['Spot clean with a damp cloth', 'Air dry'], relatedIds: ['tf-ow-05', 'tf-st-02', 'tf-bt-03', 'tf-ac-02'], createdAt: '2026-09-08',
    view: 'studio view with the strap visible',
  },
  {
    id: 'tf-bg-02', slug: 'market-canvas-tote', name: 'Market Canvas Tote', category: 'bags',
    description: 'A heavyweight waxed-canvas tote with leather-reinforced handles and an internal zip pocket. Stands up on its own and holds a 15-inch laptop.',
    price: 89000, originalPrice: 109000, badge: 'SALE', colors: [C.cream, C.black], sizes: ['Standard', 'Large'],
    material: '18 oz waxed cotton canvas. Leather trim.',
    fit: 'Standard: 38 × 36 × 14 cm. Large: 46 × 40 × 16 cm.',
    care: ['Spot clean only', 'Re-wax yearly', 'Do not machine wash'], relatedIds: ['tf-tp-03', 'tf-kn-01', 'tf-bt-02', 'tf-ac-01'], createdAt: '2026-08-02',
    view: 'front studio view with handles',
  },
  // ACCESSORIES
  {
    id: 'tf-ac-01', slug: 'drift-cashmere-blend-scarf', name: 'Drift Cashmere-Blend Scarf', category: 'accessories',
    description: 'A generously sized woven scarf in a wool-cashmere blend with hand-twisted fringe. Light enough to loop twice, warm enough for January.',
    price: 99000, badge: 'BEST', colors: [C.charcoal, C.camel, C.cream], sizes: ['Standard', 'Long'],
    material: '70% wool, 30% cashmere.',
    fit: 'Standard: 180 × 35 cm. Long: 210 × 40 cm.',
    care: ['Dry clean or hand wash cold', 'Dry flat'], relatedIds: ['tf-ow-01', 'tf-kn-01', 'tf-ac-02', 'tf-ow-04'], createdAt: '2026-09-22',
    view: 'folded flat-lay showing the fringe',
  },
  {
    id: 'tf-ac-02', slug: 'dock-ribbed-beanie', name: 'Dock Ribbed Beanie', category: 'accessories',
    description: 'A deep-cuff ribbed beanie in soft merino. Shallow enough to sit high, long enough to fold down on the coldest days.',
    price: 39000, badge: 'NEW', colors: [C.black, C.olive, C.gray, C.cream], sizes: ['S/M', 'L/XL'],
    material: '100% merino wool.',
    fit: 'S/M fits 54–57 cm, L/XL fits 57–60 cm.',
    care: KNIT_CARE, relatedIds: ['tf-ow-02', 'tf-ow-06', 'tf-ac-01', 'tf-tp-01'], createdAt: '2026-10-16',
    view: 'studio view showing the folded cuff',
  },
];

export const PRODUCTS: Product[] = seeds.map(build);

export const CATEGORIES: { slug: CategorySlug; label: string; blurb: string }[] = [
  { slug: 'outerwear', label: 'Outerwear', blurb: 'Coats, puffers, and leather built for cold cities.' },
  { slug: 'knitwear', label: 'Knitwear', blurb: 'Lambswool, merino, and mohair in honest gauges.' },
  { slug: 'tops', label: 'Tops', blurb: 'Heavyweight cotton, Oxford, and flannel layers.' },
  { slug: 'bottoms', label: 'Bottoms', blurb: 'Wide wool, corduroy, denim, and cargo.' },
  { slug: 'sets', label: 'Sets', blurb: 'Matching pieces that also work apart.' },
  { slug: 'shoes', label: 'Shoes', blurb: 'Derbies, boots, and winter sneakers.' },
  { slug: 'bags', label: 'Bags', blurb: 'Everyday carry in canvas and nylon.' },
  { slug: 'accessories', label: 'Accessories', blurb: 'Scarves and beanies for the coldest days.' },
];

export const COLLECTIONS: { slug: string; label: string }[] = [
  { slug: 'new-arrivals', label: 'New Arrivals' },
  { slug: 'best-sellers', label: 'Best Sellers' },
  ...CATEGORIES.map(({ slug, label }) => ({ slug, label })),
  { slug: 'sale', label: 'Sale' },
];

export const FALLBACK_IMAGE = 'images/products/fallback.webp';
