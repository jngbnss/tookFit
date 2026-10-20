export type MoodId = 'minimal' | 'vintage' | 'bold' | 'future' | 'classic';

export interface Mood {
  id: MoodId;
  label: string;
  tagline: string;
  description: string;
  bg: string;
  ink: string;
  accent: string;
  soft: string;
  font: string;
  /** Product ids that define the mood's edit, in display order. */
  productIds: string[];
}

export const MOODS: Mood[] = [
  {
    id: 'minimal',
    label: 'MINIMAL',
    tagline: '덜어낼수록 선명해진다',
    description: '블랙과 크림, 깨끗한 라인. 군더더기 없는 기본의 힘.',
    bg: '#f4f3ef',
    ink: '#111111',
    accent: '#111111',
    soft: '#e4e2db',
    font: "'Inter', 'Noto Sans KR', sans-serif",
    productIds: ['tf-ow-01', 'tf-kn-02', 'tf-tp-02', 'tf-tp-01', 'tf-bt-01', 'tf-sh-02', 'tf-bg-01', 'tf-ac-02', 'tf-st-01'],
  },
  {
    id: 'vintage',
    label: 'VINTAGE',
    tagline: '시간이 만든 질감',
    description: '스웨이드, 코듀로이, 플란넬. 오래 입을수록 좋아지는 옷.',
    bg: '#e8dcc5',
    ink: '#3a2a1c',
    accent: '#8a4b2a',
    soft: '#d9c8a8',
    font: "'Playfair Display', 'Noto Serif KR', serif",
    productIds: ['tf-ow-04', 'tf-kn-03', 'tf-tp-04', 'tf-bt-02', 'tf-bt-04', 'tf-bg-02', 'tf-kn-01', 'tf-tp-05'],
  },
  {
    id: 'bold',
    label: 'BOLD',
    tagline: '존재감으로 말한다',
    description: '레더, 볼륨 패딩, 헤비 부츠. 시선을 끄는 실루엣.',
    bg: '#121212',
    ink: '#f5f1e8',
    accent: '#ff5a2c',
    soft: '#26221f',
    font: "'Inter', 'Noto Sans KR', sans-serif",
    productIds: ['tf-ow-03', 'tf-ow-02', 'tf-st-02', 'tf-bt-03', 'tf-sh-03', 'tf-kn-05'],
  },
  {
    id: 'future',
    label: 'FUTURE',
    tagline: '기능이 곧 형태',
    description: '방수 셸, 퀼팅, 테크 니트. 도시를 위한 기능복.',
    bg: '#0b1016',
    ink: '#dfe8f0',
    accent: '#7cf3d0',
    soft: '#16202b',
    font: "'Space Grotesk', 'Noto Sans KR', sans-serif",
    productIds: ['tf-ow-06', 'tf-ow-05', 'tf-kn-04', 'tf-bt-05', 'tf-bg-01', 'tf-sh-02', 'tf-st-02', 'tf-bt-03'],
  },
  {
    id: 'classic',
    label: 'CLASSIC',
    tagline: '유행을 건너는 옷',
    description: '울 플란넬 셋업, 옥스포드, 더비. 단정한 테일러링.',
    bg: '#1c2433',
    ink: '#efe9dc',
    accent: '#c8a86a',
    soft: '#283247',
    font: "'Cormorant Garamond', 'Noto Serif KR', serif",
    productIds: ['tf-st-03', 'tf-ow-01', 'tf-sh-01', 'tf-tp-03', 'tf-bt-06', 'tf-ac-01', 'tf-bt-01', 'tf-kn-02'],
  },
];

export const getMood = (id: MoodId) => MOODS.find((m) => m.id === id) ?? MOODS[0];
