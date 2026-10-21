import type { CategorySlug, Product, Review } from '../domain/types';

/** Small deterministic PRNG so demo reviews are identical on every load. */
function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
const GIVEN = ['민', '준', '서', '현', '우', '지', '도', '하', '진', '태', '윤', '건', '재', '성', '혁'];
const FITS = ['정사이즈예요', '살짝 커요', '살짝 작아요'];

const BODIES: Record<CategorySlug | 'common', string[]> = {
  outerwear: [
    '두께감이 적당해서 한겨울에도 안에 니트 하나면 충분해요.',
    '어깨 라인이 자연스럽게 떨어져서 핏이 정말 예쁩니다.',
    '원단이 생각보다 고급스러워요. 가격 대비 만족합니다.',
    '바람이 많이 부는 날에도 따뜻했어요. 주머니 위치도 편해요.',
  ],
  knitwear: [
    '까슬거림 없이 부드러워요. 맨살에 입어도 괜찮았습니다.',
    '보풀이 거의 안 생기고 세탁 후에도 형태가 그대로예요.',
    '색감이 화면이랑 거의 같아요. 코트 안에 입기 딱 좋습니다.',
    '두께가 적당해서 가을부터 초봄까지 오래 입을 것 같아요.',
  ],
  tops: [
    '목 늘어남 없이 탄탄해요. 여러 장 사고 싶을 정도예요.',
    '세탁 후에도 줄어들지 않았어요. 기본템으로 강추합니다.',
    '소재가 도톰해서 단독으로 입어도 비치지 않아요.',
    '핏이 깔끔해서 출근룩으로도 잘 입고 있어요.',
  ],
  bottoms: [
    '허리 사이즈 딱 맞고 기장도 적당해요. 수선 없이 입었습니다.',
    '라인이 예쁘게 떨어져서 다리가 길어 보여요.',
    '앉았다 일어나도 구김이 적어서 편해요.',
    '두께감이 있어서 겨울에도 춥지 않아요.',
  ],
  sets: [
    '셋업으로 입어도, 따로 입어도 활용도가 높아요.',
    '상하의 색감이 완전히 똑같아서 만족스럽습니다.',
    '집에서도 밖에서도 편하게 입고 있어요.',
  ],
  shoes: [
    '처음부터 발이 편했어요. 길들이는 기간이 거의 없었습니다.',
    '정사이즈로 샀는데 딱 맞아요. 쿠션감도 좋아요.',
    '눈 오는 날 신었는데 미끄럽지 않았어요.',
  ],
  bags: ['수납공간이 넉넉하고 가벼워요.', '스트랩 길이 조절이 쉬워서 편해요.', '노트북이 들어가서 출근용으로 잘 쓰고 있어요.'],
  accessories: ['부드럽고 따뜻해요. 선물용으로도 좋을 것 같아요.', '색감이 차분해서 어떤 코트에도 잘 어울려요.', '두께가 적당해서 답답하지 않아요.'],
  common: ['배송이 빨랐어요.', '포장이 꼼꼼했습니다.', '재구매 의사 있어요.', '다른 색상도 구매하고 싶어요.', '사진보다 실물이 더 좋아요.'],
};

const LOW_BODIES = ['생각보다 핏이 커서 한 사이즈 작게 살 걸 그랬어요.', '색이 사진보다 조금 어두워요.', '괜찮은데 가격이 살짝 아쉬워요.'];

export function seededReviews(p: Product): Review[] {
  const r = rng(p.id);
  const pick = <T,>(list: T[]) => list[Math.floor(r() * list.length)];
  const count = 4 + Math.floor(r() * 10);
  const reviews: Review[] = [];
  for (let i = 0; i < count; i++) {
    const roll = r();
    const rating = roll < 0.55 ? 5 : roll < 0.85 ? 4 : roll < 0.95 ? 3 : 2;
    const body = rating <= 3 ? `${pick(LOW_BODIES)} ${pick(BODIES.common)}` : `${pick(BODIES[p.category])} ${pick(BODIES.common)}`;
    const color = pick(p.colors);
    const size = pick(p.sizes);
    const day = new Date(2026, 9, 18);
    day.setDate(day.getDate() - Math.floor(r() * 60));
    reviews.push({
      id: `${p.id}-seed-${i}`,
      productId: p.id,
      author: `${pick(SURNAMES)}*${pick(GIVEN)}`,
      rating,
      title: rating >= 5 ? '아주 만족해요' : rating === 4 ? '좋아요' : '보통이에요',
      body,
      option: `${color.name} / ${size}`,
      fit: pick(FITS),
      height: 168 + Math.floor(r() * 22),
      createdAt: day.toISOString(),
      seeded: true,
    });
  }
  return reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const cache = new Map<string, Review[]>();
export function demoReviews(p: Product): Review[] {
  if (!cache.has(p.id)) cache.set(p.id, seededReviews(p));
  return cache.get(p.id)!;
}

export function ratingSummary(reviews: Review[]) {
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }));
  return { count, average: Math.round(average * 10) / 10, distribution };
}
