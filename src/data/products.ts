import type { Badge, CategorySlug, ColorOption, Product } from '../domain/types';

const C = {
  black: { id: 'black', name: '블랙', hex: '#1c1c1e' },
  charcoal: { id: 'charcoal', name: '차콜', hex: '#3e3f42' },
  gray: { id: 'gray', name: '헤더 그레이', hex: '#8c8c8a' },
  cream: { id: 'cream', name: '크림', hex: '#e2dac8' },
  white: { id: 'white', name: '오프 화이트', hex: '#eeece6' },
  camel: { id: 'camel', name: '카멜', hex: '#b0885c' },
  brown: { id: 'brown', name: '브라운', hex: '#684a34' },
  sand: { id: 'sand', name: '샌드', hex: '#c4b292' },
  navy: { id: 'navy', name: '네이비', hex: '#28324a' },
  olive: { id: 'olive', name: '올리브', hex: '#5c6042' },
  blue: { id: 'blue', name: '페일 블루', hex: '#96acc6' },
  denim: { id: 'denim', name: '미드 블루', hex: '#4e6280' },
  washedBlack: { id: 'washed-black', name: '워시드 블랙', hex: '#38383c' },
} satisfies Record<string, ColorOption>;

export const ALL_COLORS: ColorOption[] = Object.values(C);

const SIZES = {
  apparel: ['S', 'M', 'L', 'XL'],
  bottoms: ['28', '30', '32', '34', '36'],
  shoes: ['250', '260', '270', '280', '290'],
};

const SHIPPING_STANDARD =
  '서울에서 영업일 기준 1~2일 내 출고됩니다. 기본 배송비 ₩3,000, ₩100,000 이상 구매 시 무료배송. 수령 후 14일 이내 무료 반품.';

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
  return {
    ...rest,
    featuredRank: rank,
    stock: seededStock(seed.id, seed.colors, seed.sizes),
    shipping: SHIPPING_STANDARD,
    // Two images for every color: a full studio view and a close detail view.
    images: seed.colors.flatMap((color) => [
      {
        src: `images/products/${seed.slug}-${color.id}-01.webp`,
        alt: `${color.name} ${seed.name}, ${view}`,
        colorId: color.id,
      },
      {
        src: `images/products/${seed.slug}-${color.id}-02.webp`,
        alt: `${color.name} ${seed.name} 디테일 컷, 소재와 봉제가 보이는 클로즈업`,
        colorId: color.id,
      },
    ]),
  };
}

const KNIT_CARE = ['찬물 손세탁 또는 드라이클리닝', '눕혀서 형태를 잡아 건조', '옷걸이 대신 접어서 보관', '건조기 사용 금지'];
const WOOL_CARE = ['드라이클리닝 전용', '착용 후 브러싱', '어깨가 넓은 옷걸이에 보관', '스팀으로 구김 제거'];
const COTTON_CARE = ['뒤집어서 찬물 세탁기 세탁', '비슷한 색상끼리 세탁', '저온 건조 또는 자연 건조', '필요 시 중온 다림질'];
const LEATHER_CARE = ['가죽 전문 세탁', '직사열 피하기', '시즌마다 두 번 컨디셔너 관리', '패딩 옷걸이에 보관'];

const seeds: Seed[] = [
  // 아우터
  {
    id: 'tf-ow-01', slug: 'ardent-wool-overcoat', name: '아던트 울 오버코트', category: 'outerwear',
    description: '이탈리아산 울-캐시미어 혼방 원단으로 만든 싱글 브레스티드 롱 코트입니다. 드롭 숄더와 깔끔한 노치드 라펠로 여유 있는 실루엣을 완성했고, 큐프라 안감을 더해 두꺼운 니트 위에도 부드럽게 걸쳐집니다. 히든 버튼, 깊은 웰트 포켓, 센터 벤트 디테일.',
    price: 389000, originalPrice: 459000, badge: 'NEW', colors: [C.black, C.camel, C.charcoal], sizes: SIZES.apparel,
    material: '울 80%, 캐시미어 20%. 안감: 큐프라 100%.',
    fit: '드롭 숄더의 릴랙스 핏. 182cm 모델 기준 무릎 아래 기장. 니트 위 착용을 고려해 평소 사이즈를 추천합니다.',
    care: WOOL_CARE, relatedIds: ['tf-kn-01', 'tf-bt-01', 'tf-sh-03', 'tf-ac-01'], createdAt: '2026-10-12',
    view: '따뜻한 스톤 톤 배경의 플랫레이 컷',
  },
  {
    id: 'tf-ow-02', slug: 'northline-down-puffer', name: '노스라인 다운 패딩', category: 'outerwear',
    description: 'RDS 인증 덕다운 80/20을 충전한 박시한 미드 기장 패딩입니다. 매트한 재생 나일론 겉감이 가벼운 비와 바람을 막아주고, 넓은 가로 퀼팅이 단정한 형태를 만듭니다. 투웨이 지퍼, 스톰 플랩, 플리스 안감 손 포켓.',
    price: 329000, originalPrice: 369000, badge: 'BEST', colors: [C.black, C.olive, C.navy], sizes: SIZES.apparel,
    material: '겉감: 재생 나일론 100%. 충전재: 덕다운 80%, 깃털 20% (RDS 인증).',
    fit: '엉덩이를 살짝 덮는 박시 핏. 슬림하게 입으려면 한 사이즈 작게 선택하세요.',
    care: ['찬물 울코스 세탁기 세탁', '드라이어 볼과 함께 저온 건조', '드라이클리닝 금지', '압축하지 않고 보관'],
    relatedIds: ['tf-kn-04', 'tf-bt-03', 'tf-sh-02', 'tf-ac-02'], createdAt: '2026-09-28',
    view: '넓은 퀼팅이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-ow-03', slug: 'meridian-leather-bomber', name: '메리디안 레더 봄버', category: 'outerwear',
    description: '식물성 태닝 마감의 부드러운 램스킨 봄버 재킷입니다. 입을수록 자연스럽게 길들여지며, 칼라·소매·밑단은 두툼한 메리노 립으로 마감했습니다. 투웨이 브라스 지퍼와 퀼팅 안감으로 부피감 없이 따뜻합니다.',
    price: 459000, badge: 'LIMITED', colors: [C.black, C.brown], sizes: SIZES.apparel,
    material: '램스킨 가죽 100%. 립: 메리노 울 100%. 안감: 폴리에스터 퀼팅 100%.',
    fit: '허리에 떨어지는 레귤러 핏. 정사이즈.',
    care: LEATHER_CARE, relatedIds: ['tf-tp-02', 'tf-bt-04', 'tf-sh-03', 'tf-bg-01'], createdAt: '2026-10-05',
    view: '가죽 광택과 립 밑단이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-ow-04', slug: 'sable-suede-blouson', name: '세이블 스웨이드 블루종', category: 'outerwear',
    description: '스프레드 칼라와 스냅 버튼 플래킷을 갖춘 고트 스웨이드 쇼트 블루종입니다. 매트한 결이 데님, 니트와 자연스럽게 어울리며 사이드 탭으로 밑단을 조절할 수 있습니다.',
    price: 293000, originalPrice: 419000, badge: 'SALE', colors: [C.brown, C.sand, C.olive], sizes: SIZES.apparel,
    material: '고트 스웨이드 100%. 안감: 코튼 트윌 100%.',
    fit: '몸판은 여유 있고 허리 기장은 짧은 크롭 핏.',
    care: ['스웨이드 전문 세탁', '스웨이드 브러시로 관리', '착용 전 방수 스프레이 사용', '폭우 시 착용 자제'],
    relatedIds: ['tf-kn-02', 'tf-bt-04', 'tf-sh-01', 'tf-ac-01'], createdAt: '2026-08-30',
    view: '스프레드 칼라와 스냅 플래킷이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-ow-05', slug: 'fieldwork-quilted-jacket', name: '필드워크 퀼팅 재킷', category: 'outerwear',
    description: '코듀로이 칼라를 단 가벼운 다이아몬드 퀼팅 재킷입니다. 코트 안 레이어드는 물론 초겨울까지 단독으로 입기 좋고, 재생 폴리 패딩으로 따뜻하면서 가볍습니다.',
    price: 219000, badge: 'NEW', colors: [C.olive, C.navy, C.black], sizes: SIZES.apparel,
    material: '겉감: 재생 나일론 100%. 패딩: 재생 폴리에스터 100%. 칼라: 코튼 코듀로이.',
    fit: '엉덩이 기장의 레귤러 핏. 안에 니트를 입을 수 있는 여유.',
    care: COTTON_CARE, relatedIds: ['tf-tp-05', 'tf-bt-02', 'tf-sh-02', 'tf-bg-01'], createdAt: '2026-10-08',
    view: '다이아몬드 퀼팅이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-ow-06', slug: 'stratus-technical-parka', name: '스트라투스 테크니컬 파카', category: 'outerwear',
    description: '심실링 처리한 3레이어 방수 파카입니다. 구조적인 후드와 숨겨진 하드웨어로 도시에서도 차분하게 입을 수 있습니다. 벨로즈 포켓, 내부 수납 포켓, 소매 조절 탭.',
    price: 399000, badge: 'BEST', colors: [C.charcoal, C.olive, C.black], sizes: SIZES.apparel,
    material: '방수 멤브레인 3레이어 재생 폴리에스터 (내수압 20,000mm). 안감: 기모 트리코트.',
    fit: '뒷기장이 더 긴 오버사이즈 핏. 평소 사이즈 추천.',
    care: ['지퍼를 모두 잠그고 찬물 세탁', '저온 건조로 발수 기능 회복', '섬유유연제 사용 금지', '드라이클리닝 금지'],
    relatedIds: ['tf-kn-04', 'tf-bt-03', 'tf-sh-02', 'tf-ac-02'], createdAt: '2026-09-15',
    view: '후드를 세운 플랫레이 컷',
  },
  // 니트
  {
    id: 'tf-kn-01', slug: 'harbor-cable-knit-sweater', name: '하버 케이블 니트', category: 'knitwear',
    description: '무염색 램스울로 짠 헤비웨이트 피셔맨 스웨터입니다. 중앙 케이블 패턴과 허니콤 조직이 특징이며, 새들 숄더와 살짝 내려온 암홀로 아우터 안에 레이어드하기 좋습니다.',
    price: 169000, originalPrice: 189000, badge: 'BEST', colors: [C.cream, C.navy, C.charcoal], sizes: SIZES.apparel,
    material: '램스울 100%, 5게이지.',
    fit: '엉덩이 기장의 릴랙스 핏. 단정하게 입으려면 한 사이즈 작게.',
    care: KNIT_CARE, relatedIds: ['tf-ow-01', 'tf-bt-02', 'tf-ac-02', 'tf-sh-03'], createdAt: '2026-09-20',
    view: '케이블 패턴이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-kn-02', slug: 'linea-mock-neck-knit', name: '리네아 모크넥 니트', category: 'knitwear',
    description: '풀패션 공법으로 만든 파인 게이지 메리노 모크넥입니다. 블레이저 안에 입을 만큼 얇고, 추운 출근길에도 충분히 따뜻합니다. 낮은 넥이 답답하지 않게 목을 감쌉니다.',
    price: 129000, badge: 'NEW', colors: [C.black, C.cream, C.gray], sizes: SIZES.apparel,
    material: '엑스트라 파인 메리노 울 100%, 14게이지.',
    fit: '몸판은 슬림, 소매는 레귤러. 정사이즈.',
    care: KNIT_CARE, relatedIds: ['tf-ow-04', 'tf-st-03', 'tf-bt-01', 'tf-sh-01'], createdAt: '2026-10-14',
    view: '밝은 스튜디오 배경의 플랫레이 컷',
  },
  {
    id: 'tf-kn-03', slug: 'atelier-shawl-cardigan', name: '아틀리에 숄칼라 가디건', category: 'knitwear',
    description: '부드러운 울-알파카 혼방의 청키한 숄칼라 가디건입니다. 코로조 버튼과 패치 포켓이 편안한 무드를 더합니다. 실내에서는 가벼운 재킷처럼, 외출 시에는 코트 안에 입기 좋습니다.',
    price: 153000, originalPrice: 219000, badge: 'SALE', colors: [C.brown, C.charcoal], sizes: SIZES.apparel,
    material: '울 60%, 알파카 30%, 나일론 10%. 코로조 너트 버튼.',
    fit: '엉덩이 기장의 릴랙스 핏.',
    care: KNIT_CARE, relatedIds: ['tf-tp-03', 'tf-bt-02', 'tf-ac-01', 'tf-kn-05'], createdAt: '2026-08-25',
    view: '숄칼라와 버튼이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-kn-04', slug: 'ridge-half-zip-knit', name: '릿지 하프집 니트', category: 'knitwear',
    description: '체온 조절이 뛰어난 메리노-코튼 혼방 골지 하프집 니트입니다. 퍼널 칼라, 매트한 메탈 지퍼, 형태가 잘 유지되는 립 커프스.',
    price: 119000, originalPrice: 149000, colors: [C.navy, C.gray, C.olive], sizes: SIZES.apparel,
    material: '메리노 울 70%, 코튼 30%.',
    fit: '레귤러 핏. 정사이즈.',
    care: KNIT_CARE, relatedIds: ['tf-ow-02', 'tf-bt-03', 'tf-sh-02', 'tf-ac-02'], createdAt: '2026-09-02',
    view: '칼라 지퍼를 올린 플랫레이 컷',
  },
  {
    id: 'tf-kn-05', slug: 'loft-brushed-mohair-crew', name: '로프트 브러시드 모헤어 니트', category: 'knitwear',
    description: '부드러운 헤일로가 살아 있는 브러시드 모헤어 크루넥입니다. 무게에 비해 놀랍도록 따뜻하고, 성긴 조직 사이로 안에 입은 셔츠가 은은하게 비칩니다.',
    price: 179000, badge: 'LIMITED', colors: [C.gray, C.cream, C.brown], sizes: SIZES.apparel,
    material: '모헤어 55%, 울 25%, 폴리아미드 20%.',
    fit: '드롭 숄더의 오버사이즈 핏.',
    care: KNIT_CARE, relatedIds: ['tf-tp-03', 'tf-bt-01', 'tf-ow-01', 'tf-sh-01'], createdAt: '2026-10-02',
    view: '브러시드 텍스처가 보이는 플랫레이 컷',
  },
  // 상의
  {
    id: 'tf-tp-01', slug: 'base-heavyweight-sweatshirt', name: '베이스 헤비웨이트 맨투맨', category: 'tops',
    description: '여러 번 세탁해도 형태가 유지되는 480g 루프백 맨투맨입니다. 박시한 몸판과 넓은 립 밑단. 추운 계절의 가장 기본이 되는 이너입니다.',
    price: 89000, badge: 'BEST', colors: [C.gray, C.black, C.cream], sizes: SIZES.apparel,
    material: '오가닉 코튼 루프백 100%, 480g.',
    fit: '살짝 짧은 박시 핏. 평소 사이즈 추천.',
    care: COTTON_CARE, relatedIds: ['tf-bt-05', 'tf-sh-02', 'tf-ac-02', 'tf-ow-02'], createdAt: '2026-08-18',
    view: '밝은 스튜디오 배경의 플랫레이 컷',
  },
  {
    id: 'tf-tp-02', slug: 'studio-long-sleeve-tee', name: '스튜디오 긴팔 티셔츠', category: 'tops',
    description: '목이 늘어나지 않는 탄탄한 컴팩트 저지 긴팔 티셔츠입니다. 셔츠, 니트, 코트 안 어디에나 받쳐 입기 좋은 기본 레이어.',
    price: 29000, originalPrice: 49000, badge: 'SALE', colors: [C.white, C.charcoal, C.black], sizes: SIZES.apparel,
    material: '코마사 코튼 저지 100%, 240g.',
    fit: '소매가 살짝 긴 레귤러 핏.',
    care: COTTON_CARE, relatedIds: ['tf-ow-03', 'tf-bt-04', 'tf-kn-02', 'tf-sh-02'], createdAt: '2026-07-30',
    view: '플랫레이 컷',
  },
  {
    id: 'tf-tp-03', slug: 'campus-oxford-shirt', name: '캠퍼스 옥스포드 셔츠', category: 'tops',
    description: '부드럽게 워싱한 코튼 버튼다운 옥스포드 셔츠입니다. 자연스럽게 말리는 칼라, 가슴 포켓 하나, 넣어 입어도 빼 입어도 좋은 라운드 밑단.',
    price: 99000, badge: 'NEW', colors: [C.blue, C.white, C.cream], sizes: SIZES.apparel,
    material: '코튼 옥스포드 100%.',
    fit: '릴랙스 핏. 정사이즈.',
    care: COTTON_CARE, relatedIds: ['tf-kn-03', 'tf-bt-06', 'tf-sh-01', 'tf-kn-05'], createdAt: '2026-10-10',
    view: '버튼다운 칼라가 보이는 플랫레이 컷',
  },
  {
    id: 'tf-tp-04', slug: 'quarry-flannel-overshirt', name: '쿼리 플란넬 오버셔츠', category: 'tops',
    description: '톤온톤 체크의 기모 코튼-울 플란넬 오버셔츠입니다. 플랩 가슴 포켓 두 개와 도톰한 두께로 포근한 겨울날에는 셔츠 재킷처럼 입을 수 있습니다.',
    price: 97000, originalPrice: 139000, badge: 'SALE', colors: [C.brown, C.olive, C.charcoal], sizes: SIZES.apparel,
    material: '코튼 80%, 울 20% 기모 플란넬.',
    fit: '티셔츠나 얇은 니트를 받쳐 입을 수 있는 릴랙스 핏.',
    care: COTTON_CARE, relatedIds: ['tf-ow-05', 'tf-bt-03', 'tf-ac-02', 'tf-sh-03'], createdAt: '2026-08-12',
    view: '톤온톤 체크가 보이는 플랫레이 컷',
  },
  {
    id: 'tf-tp-05', slug: 'echo-waffle-henley', name: '에코 와플 헨리넥', category: 'tops',
    description: '3버튼 플래킷의 써멀 와플 헨리넥입니다. 몸판이 살짝 길어 퀼팅 재킷이나 오버셔츠 안에 통기성 좋게 레이어드할 수 있습니다.',
    price: 59000, originalPrice: 69000, colors: [C.cream, C.charcoal, C.olive], sizes: SIZES.apparel,
    material: '코튼 와플 니트 100%.',
    fit: '레귤러 핏. 정사이즈.',
    care: COTTON_CARE, relatedIds: ['tf-ow-05', 'tf-bt-04', 'tf-kn-03', 'tf-ac-02'], createdAt: '2026-09-05',
    view: '와플 조직이 보이는 플랫레이 컷',
  },
  // 하의
  {
    id: 'tf-bt-01', slug: 'avenue-wide-wool-trousers', name: '애비뉴 와이드 울 트라우저', category: 'bottoms',
    description: '흐르듯 떨어지는 울 플란넬 투턱 와이드 트라우저입니다. 하이 라이즈와 선명한 주름선이 길고 끊김 없는 라인을 만들어 부츠나 더비 위로 멋스럽게 떨어집니다.',
    price: 179000, badge: 'BEST', colors: [C.charcoal, C.brown, C.black], sizes: SIZES.bottoms,
    material: '울 플란넬 100%. 주머니감: 코튼.',
    fit: '하이 라이즈 와이드 핏. 인심 80cm.',
    care: WOOL_CARE, relatedIds: ['tf-ow-01', 'tf-kn-02', 'tf-sh-01', 'tf-kn-05'], createdAt: '2026-09-12',
    view: '주름선이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-bt-02', slug: 'harlow-corduroy-pants', name: '할로우 코듀로이 팬츠', category: 'bottoms',
    description: '8웨일 코튼 코듀로이의 릴랙스 스트레이트 팬츠입니다. 처음부터 부드럽고, 원턱으로 힙 부분이 편안합니다.',
    price: 109000, originalPrice: 129000, colors: [C.brown, C.cream, C.navy], sizes: SIZES.bottoms,
    material: '코튼 코듀로이 100%, 8웨일.',
    fit: '미드 라이즈 릴랙스 스트레이트 핏.',
    care: COTTON_CARE, relatedIds: ['tf-kn-01', 'tf-ow-05', 'tf-sh-03', 'tf-kn-03'], createdAt: '2026-08-22',
    view: '코듀로이 골이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-bt-03', slug: 'terrain-cargo-pants', name: '테레인 카고 팬츠', category: 'bottoms',
    description: '발수 립스탑 원단에 로우 프로파일 벨로즈 포켓을 단 유틸리티 카고 팬츠입니다. 조절 가능한 테이퍼드 밑단으로 볼륨을 정돈했습니다.',
    price: 139000, badge: 'NEW', colors: [C.olive, C.black, C.sand], sizes: SIZES.bottoms,
    material: '코튼 립스탑 100%, 발수 가공.',
    fit: '허벅지는 여유 있고 발목은 좁아지는 테이퍼드 핏.',
    care: COTTON_CARE, relatedIds: ['tf-ow-06', 'tf-kn-04', 'tf-sh-02', 'tf-bg-01'], createdAt: '2026-10-09',
    view: '카고 포켓이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-bt-04', slug: 'ash-washed-denim', name: '애쉬 워시드 데님', category: 'bottoms',
    description: '빈티지 워싱을 더한 13.5oz 일본산 데님의 살짝 넓은 스트레이트 팬츠입니다. 코퍼 리벳, 버튼 플라이, 토바코 컬러 스티치.',
    price: 149000, colors: [C.washedBlack, C.denim], sizes: SIZES.bottoms,
    material: '일본산 코튼 데님 100%, 13.5oz.',
    fit: '미드 라이즈의 살짝 넓은 스트레이트 핏. 평소 허리 사이즈.',
    care: ['뒤집어서 찬물 세탁', '색 유지를 위해 세탁 최소화', '자연 건조', '표백제 사용 금지'],
    relatedIds: ['tf-ow-03', 'tf-tp-02', 'tf-sh-02', 'tf-ow-04'], createdAt: '2026-07-25',
    view: '워싱이 보이는 플랫레이 컷',
  },
  {
    id: 'tf-bt-05', slug: 'rest-fleece-sweatpants', name: '레스트 기모 스웨트팬츠', category: 'bottoms',
    description: '넓은 허리 밴드, 숨겨진 스트링, 살짝 좁아지는 밑단의 기모 스웨트팬츠입니다. 베이스 헤비웨이트 맨투맨과 셋업으로 맞춰 입기 좋습니다.',
    price: 59000, originalPrice: 99000, badge: 'SALE', colors: [C.gray, C.navy, C.black], sizes: SIZES.bottoms,
    material: '오가닉 코튼 기모 100%, 420g.',
    fit: '허벅지는 여유 있고 밑단은 좁아지는 핏.',
    care: COTTON_CARE, relatedIds: ['tf-tp-01', 'tf-sh-02', 'tf-ac-02', 'tf-ow-02'], createdAt: '2026-08-05',
    view: '스트링 허리가 보이는 플랫레이 컷',
  },
  {
    id: 'tf-bt-06', slug: 'pleat-tapered-chinos', name: '플리트 테이퍼드 치노', category: 'bottoms',
    description: '촘촘한 기모 트윌의 원턱 치노 팬츠입니다. 테이퍼드 핏과 깔끔한 마감으로 주말에 울 트라우저 대신 편하게 입기 좋습니다.',
    price: 95000, originalPrice: 119000, colors: [C.sand, C.navy, C.black], sizes: SIZES.bottoms,
    material: '코튼 98%, 엘라스테인 2% 기모 트윌.',
    fit: '미드 라이즈 테이퍼드 핏. 평소 허리 사이즈.',
    care: COTTON_CARE, relatedIds: ['tf-tp-03', 'tf-kn-02', 'tf-sh-01', 'tf-ow-04'], createdAt: '2026-09-25',
    view: '플랫레이 컷',
  },
  // 세트
  {
    id: 'tf-st-01', slug: 'hearth-knit-lounge-set', name: '허스 니트 라운지 세트', category: 'sets',
    description: '부드러운 울-코튼 혼방의 골지 크루넥과 니트 팬츠 세트입니다. 집에서는 함께, 주중에는 따로 나눠 입어도 좋습니다.',
    price: 229000, badge: 'LIMITED', colors: [C.cream, C.gray], sizes: SIZES.apparel,
    material: '울 50%, 코튼 50% 골지 니트.',
    fit: '릴랙스 크루넥과 밴딩 스트레이트 팬츠.',
    care: KNIT_CARE, relatedIds: ['tf-ac-02', 'tf-sh-02', 'tf-kn-05', 'tf-ac-01'], createdAt: '2026-10-01',
    view: '상의와 팬츠를 함께 놓은 플랫레이 컷',
  },
  {
    id: 'tf-st-02', slug: 'transit-tracksuit-set', name: '트랜짓 트랙수트 세트', category: 'sets',
    description: '매트한 더블 니트에 배색 파이핑을 더한 트랙수트 세트입니다. 집업 재킷과 테이퍼드 팬츠 모두 코트를 걸쳐 외출할 수 있을 만큼 단정한 핏입니다.',
    price: 179000, originalPrice: 199000, badge: 'NEW', colors: [C.black, C.navy], sizes: SIZES.apparel,
    material: '폴리에스터 88%, 엘라스테인 12% 더블 니트.',
    fit: '레귤러 재킷, 테이퍼드 팬츠. 정사이즈.',
    care: COTTON_CARE, relatedIds: ['tf-sh-02', 'tf-ow-02', 'tf-bg-01', 'tf-ac-02'], createdAt: '2026-10-15',
    view: '배색 파이핑 재킷과 팬츠의 플랫레이 컷',
  },
  {
    id: 'tf-st-03', slug: 'column-flannel-two-piece', name: '칼럼 플란넬 투피스', category: 'sets',
    description: '부드러운 울 플란넬의 언스트럭처드 싱글 재킷과 원턱 트라우저 셋업입니다. 어깨 패드를 최소화하고 패치 포켓을 달아 편안하고 모던한 수트로 완성했습니다.',
    price: 489000, colors: [C.charcoal, C.navy], sizes: SIZES.apparel,
    material: '울 플란넬 100%. 반안감: 큐프라.',
    fit: '릴랙스 재킷과 와이드 트라우저. 같은 사이즈로 세트 판매.',
    care: WOOL_CARE, relatedIds: ['tf-kn-02', 'tf-sh-01', 'tf-ac-01', 'tf-tp-03'], createdAt: '2026-09-18',
    view: '재킷과 트라우저를 함께 놓은 플랫레이 컷',
  },
  // 신발
  {
    id: 'tf-sh-01', slug: 'clerk-leather-derby', name: '클럭 레더 더비', category: 'shoes',
    description: '가벼운 러버 솔 위에 광택 있는 카프 가죽을 얹은 라운드 토 더비 슈즈입니다. 굿이어 웰트 제법으로 오랫동안 창갈이하며 신을 수 있습니다.',
    price: 207000, originalPrice: 259000, colors: [C.black, C.brown], sizes: SIZES.shoes,
    material: '갑피: 카프 가죽. 안감: 가죽. 밑창: 러버, 굿이어 웰트.',
    fit: '정사이즈. mm 단위(한국 사이즈).',
    care: ['마른 천으로 닦기', '무색 크림으로 광택 관리', '시더 슈트리 사용', '하루씩 쉬어가며 착용'],
    relatedIds: ['tf-bt-01', 'tf-st-03', 'tf-kn-02', 'tf-bt-06'], createdAt: '2026-08-15',
    view: '측면 스튜디오 컷',
  },
  {
    id: 'tf-sh-02', slug: 'frost-winter-sneaker', name: '프로스트 윈터 스니커즈', category: 'shoes',
    description: '시어링 안감 칼라와 미끄럼 방지 사이핑 러버 솔을 갖춘 깔끔한 레더 스니커즈입니다. 빙판길에서도 안정적입니다.',
    price: 189000, badge: 'BEST', colors: [C.cream, C.black, C.gray], sizes: SIZES.shoes,
    material: '갑피: 가죽. 안감: 시어링. 밑창: 천연 고무.',
    fit: '정사이즈. 반 사이즈는 큰 쪽을 선택하세요.',
    care: ['젖은 천으로 닦기', '방수 스프레이 사용', '열원을 피해 자연 건조'],
    relatedIds: ['tf-tp-01', 'tf-bt-05', 'tf-ow-02', 'tf-st-02'], createdAt: '2026-09-30',
    view: '측면 스튜디오 컷',
  },
  {
    id: 'tf-sh-03', slug: 'moor-chelsea-boots', name: '무어 첼시 부츠', category: 'shoes',
    description: '슬림한 아몬드 토, 넓은 고무 밴드, 코만도 러버 솔의 첼시 부츠입니다. 왁스드 가죽이라 눈 녹은 길에서도 관리가 쉽습니다.',
    price: 289000, badge: 'NEW', colors: [C.black, C.brown], sizes: SIZES.shoes,
    material: '갑피: 왁스드 카프 가죽. 밑창: 코만도 러버.',
    fit: '정사이즈. mm 단위(한국 사이즈).',
    care: ['착용 후 브러시로 먼지 제거', '겨울철 월 1회 왁스 관리', '시더 슈트리 사용'],
    relatedIds: ['tf-ow-01', 'tf-bt-01', 'tf-ow-03', 'tf-bt-04'], createdAt: '2026-10-11',
    view: '측면 스튜디오 컷',
  },
  // 가방
  {
    id: 'tf-bg-01', slug: 'commute-nylon-crossbody', name: '커뮤트 나일론 크로스백', category: 'bags',
    description: '촘촘한 발리스틱 나일론에 마그네틱 버클과 조절 웨빙 스트랩을 단 콤팩트 크로스백입니다. 휴대폰, 지갑, 작은 노트가 들어갑니다.',
    price: 129000, colors: [C.black, C.olive], sizes: ['기본', '라지'],
    material: '재생 발리스틱 나일론 100%. 알루미늄 하드웨어.',
    fit: '기본: 24 × 16 × 7cm. 라지: 30 × 20 × 9cm. 스트랩 70~130cm 조절.',
    care: ['젖은 천으로 부분 세척', '자연 건조'], relatedIds: ['tf-ow-05', 'tf-st-02', 'tf-bt-03', 'tf-ac-02'], createdAt: '2026-09-08',
    view: '스트랩이 보이는 스튜디오 컷',
  },
  {
    id: 'tf-bg-02', slug: 'market-canvas-tote', name: '마켓 캔버스 토트백', category: 'bags',
    description: '가죽으로 보강한 손잡이와 내부 지퍼 포켓을 갖춘 헤비 왁스드 캔버스 토트백입니다. 혼자 서 있을 만큼 탄탄하고 15인치 노트북이 들어갑니다.',
    price: 65000, originalPrice: 109000, badge: 'SALE', colors: [C.cream, C.black], sizes: ['기본', '라지'],
    material: '18oz 왁스드 코튼 캔버스. 가죽 트림.',
    fit: '기본: 38 × 36 × 14cm. 라지: 46 × 40 × 16cm.',
    care: ['부분 세척만 가능', '매년 왁스 재처리', '세탁기 사용 금지'], relatedIds: ['tf-tp-03', 'tf-kn-01', 'tf-bt-02', 'tf-ac-01'], createdAt: '2026-08-02',
    view: '손잡이가 보이는 정면 스튜디오 컷',
  },
  // 액세서리
  {
    id: 'tf-ac-01', slug: 'drift-cashmere-blend-scarf', name: '드리프트 캐시미어 블렌드 머플러', category: 'accessories',
    description: '손으로 꼰 프린지를 단 넉넉한 사이즈의 울-캐시미어 머플러입니다. 두 번 감을 만큼 가볍고 1월 추위에도 충분히 따뜻합니다.',
    price: 79000, originalPrice: 99000, badge: 'BEST', colors: [C.charcoal, C.camel, C.cream], sizes: ['기본', '롱'],
    material: '울 70%, 캐시미어 30%.',
    fit: '기본: 180 × 35cm. 롱: 210 × 40cm.',
    care: ['드라이클리닝 또는 찬물 손세탁', '눕혀서 건조'], relatedIds: ['tf-ow-01', 'tf-kn-01', 'tf-ac-02', 'tf-ow-04'], createdAt: '2026-09-22',
    view: '프린지가 보이는 플랫레이 컷',
  },
  {
    id: 'tf-ac-02', slug: 'dock-ribbed-beanie', name: '독 립 비니', category: 'accessories',
    description: '부드러운 메리노로 짠 딥 커프 골지 비니입니다. 높게 얹어 써도, 가장 추운 날 내려 써도 좋은 길이입니다.',
    price: 39000, badge: 'NEW', colors: [C.black, C.olive, C.gray, C.cream], sizes: ['S/M', 'L/XL'],
    material: '메리노 울 100%.',
    fit: 'S/M 머리둘레 54~57cm, L/XL 57~60cm.',
    care: KNIT_CARE, relatedIds: ['tf-ow-02', 'tf-ow-06', 'tf-ac-01', 'tf-tp-01'], createdAt: '2026-10-16',
    view: '접은 커프가 보이는 스튜디오 컷',
  },
];

export const PRODUCTS: Product[] = seeds.map(build);

export const CATEGORIES: { slug: CategorySlug; label: string; blurb: string }[] = [
  { slug: 'outerwear', label: '아우터', blurb: '추운 도시를 위한 코트, 패딩, 레더 재킷.' },
  { slug: 'knitwear', label: '니트', blurb: '램스울, 메리노, 모헤어로 짠 정직한 니트.' },
  { slug: 'tops', label: '상의', blurb: '헤비웨이트 코튼, 옥스포드, 플란넬 레이어.' },
  { slug: 'bottoms', label: '하의', blurb: '와이드 울, 코듀로이, 데님, 카고.' },
  { slug: 'sets', label: '세트', blurb: '함께 입어도, 따로 입어도 좋은 셋업.' },
  { slug: 'shoes', label: '신발', blurb: '더비, 부츠, 윈터 스니커즈.' },
  { slug: 'bags', label: '가방', blurb: '캔버스와 나일론으로 만든 데일리 백.' },
  { slug: 'accessories', label: '액세서리', blurb: '가장 추운 날을 위한 머플러와 비니.' },
];

export const COLLECTIONS: { slug: string; label: string }[] = [
  { slug: 'new-arrivals', label: '신상품' },
  { slug: 'best-sellers', label: '베스트' },
  ...CATEGORIES.map(({ slug, label }) => ({ slug, label })),
  { slug: 'sale', label: '세일' },
];

export const BADGE_LABELS: Record<Badge, string> = {
  NEW: '신상품',
  BEST: '베스트',
  LIMITED: '한정',
  SALE: '세일',
};

export const FALLBACK_IMAGE = 'images/products/fallback.webp';
