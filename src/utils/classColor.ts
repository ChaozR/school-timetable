export interface ClassColorTheme {
  badge: string;
  accentBorder: string;
  dot: string;
  isDark: boolean;
}

interface ShadeEntry {
  bg: string;
  text: string;
  isDark: boolean;
}

interface GradeTailwindPalette {
  accentBorder: string;
  dot: string;
  shades: ShadeEntry[];
}

// Tailwind CSS 기본 팔레트(50 ~ 950) 순차 매핑 (JIT 스캔을 위해 전체 클래스 문자열 명시)
const GRADE_TAILWIND_PALETTES: GradeTailwindPalette[] = [
  {
    // 1학년: blue
    accentBorder: 'border-l-4 border-l-blue-600',
    dot: 'bg-blue-600',
    shades: [
      { bg: 'bg-blue-50', text: 'text-slate-900', isDark: false },
      { bg: 'bg-blue-100', text: 'text-slate-900', isDark: false },
      { bg: 'bg-blue-200', text: 'text-slate-900', isDark: false },
      { bg: 'bg-blue-300', text: 'text-slate-900', isDark: false },
      { bg: 'bg-blue-400', text: 'text-slate-950', isDark: false },
      { bg: 'bg-blue-500', text: 'text-white', isDark: true },
      { bg: 'bg-blue-600', text: 'text-white', isDark: true },
      { bg: 'bg-blue-700', text: 'text-white', isDark: true },
      { bg: 'bg-blue-800', text: 'text-white', isDark: true },
      { bg: 'bg-blue-900', text: 'text-white', isDark: true },
      { bg: 'bg-blue-950', text: 'text-white', isDark: true },
    ],
  },
  {
    // 2학년: emerald
    accentBorder: 'border-l-4 border-l-emerald-600',
    dot: 'bg-emerald-600',
    shades: [
      { bg: 'bg-emerald-50', text: 'text-slate-900', isDark: false },
      { bg: 'bg-emerald-100', text: 'text-slate-900', isDark: false },
      { bg: 'bg-emerald-200', text: 'text-slate-900', isDark: false },
      { bg: 'bg-emerald-300', text: 'text-slate-900', isDark: false },
      { bg: 'bg-emerald-400', text: 'text-slate-950', isDark: false },
      { bg: 'bg-emerald-500', text: 'text-white', isDark: true },
      { bg: 'bg-emerald-600', text: 'text-white', isDark: true },
      { bg: 'bg-emerald-700', text: 'text-white', isDark: true },
      { bg: 'bg-emerald-800', text: 'text-white', isDark: true },
      { bg: 'bg-emerald-900', text: 'text-white', isDark: true },
      { bg: 'bg-emerald-950', text: 'text-white', isDark: true },
    ],
  },
  {
    // 3학년: amber
    accentBorder: 'border-l-4 border-l-amber-600',
    dot: 'bg-amber-600',
    shades: [
      { bg: 'bg-amber-50', text: 'text-slate-900', isDark: false },
      { bg: 'bg-amber-100', text: 'text-slate-900', isDark: false },
      { bg: 'bg-amber-200', text: 'text-slate-900', isDark: false },
      { bg: 'bg-amber-300', text: 'text-slate-900', isDark: false },
      { bg: 'bg-amber-400', text: 'text-slate-950', isDark: false },
      { bg: 'bg-amber-500', text: 'text-slate-950', isDark: false },
      { bg: 'bg-amber-600', text: 'text-white', isDark: true },
      { bg: 'bg-amber-700', text: 'text-white', isDark: true },
      { bg: 'bg-amber-800', text: 'text-white', isDark: true },
      { bg: 'bg-amber-900', text: 'text-white', isDark: true },
      { bg: 'bg-amber-950', text: 'text-white', isDark: true },
    ],
  },
  {
    // 4학년: violet
    accentBorder: 'border-l-4 border-l-violet-600',
    dot: 'bg-violet-600',
    shades: [
      { bg: 'bg-violet-50', text: 'text-slate-900', isDark: false },
      { bg: 'bg-violet-100', text: 'text-slate-900', isDark: false },
      { bg: 'bg-violet-200', text: 'text-slate-900', isDark: false },
      { bg: 'bg-violet-300', text: 'text-slate-900', isDark: false },
      { bg: 'bg-violet-400', text: 'text-slate-950', isDark: false },
      { bg: 'bg-violet-500', text: 'text-white', isDark: true },
      { bg: 'bg-violet-600', text: 'text-white', isDark: true },
      { bg: 'bg-violet-700', text: 'text-white', isDark: true },
      { bg: 'bg-violet-800', text: 'text-white', isDark: true },
      { bg: 'bg-violet-900', text: 'text-white', isDark: true },
      { bg: 'bg-violet-950', text: 'text-white', isDark: true },
    ],
  },
  {
    // 5학년: teal
    accentBorder: 'border-l-4 border-l-teal-600',
    dot: 'bg-teal-600',
    shades: [
      { bg: 'bg-teal-50', text: 'text-slate-900', isDark: false },
      { bg: 'bg-teal-100', text: 'text-slate-900', isDark: false },
      { bg: 'bg-teal-200', text: 'text-slate-900', isDark: false },
      { bg: 'bg-teal-300', text: 'text-slate-900', isDark: false },
      { bg: 'bg-teal-400', text: 'text-slate-950', isDark: false },
      { bg: 'bg-teal-500', text: 'text-white', isDark: true },
      { bg: 'bg-teal-600', text: 'text-white', isDark: true },
      { bg: 'bg-teal-700', text: 'text-white', isDark: true },
      { bg: 'bg-teal-800', text: 'text-white', isDark: true },
      { bg: 'bg-teal-900', text: 'text-white', isDark: true },
      { bg: 'bg-teal-950', text: 'text-white', isDark: true },
    ],
  },
  {
    // 6학년: rose
    accentBorder: 'border-l-4 border-l-rose-600',
    dot: 'bg-rose-600',
    shades: [
      { bg: 'bg-rose-50', text: 'text-slate-900', isDark: false },
      { bg: 'bg-rose-100', text: 'text-slate-900', isDark: false },
      { bg: 'bg-rose-200', text: 'text-slate-900', isDark: false },
      { bg: 'bg-rose-300', text: 'text-slate-900', isDark: false },
      { bg: 'bg-rose-400', text: 'text-slate-950', isDark: false },
      { bg: 'bg-rose-500', text: 'text-white', isDark: true },
      { bg: 'bg-rose-600', text: 'text-white', isDark: true },
      { bg: 'bg-rose-700', text: 'text-white', isDark: true },
      { bg: 'bg-rose-800', text: 'text-white', isDark: true },
      { bg: 'bg-rose-900', text: 'text-white', isDark: true },
      { bg: 'bg-rose-950', text: 'text-white', isDark: true },
    ],
  },
];

function parseGradeAndClass(className: string): { grade: number; classNum: number } {
  const [gradeStr, classStr] = className.split('-');
  const grade = parseInt(gradeStr, 10);
  const classNum = parseInt(classStr, 10);
  return {
    grade: Number.isNaN(grade) || grade < 1 ? 1 : grade,
    classNum: Number.isNaN(classNum) || classNum < 1 ? 1 : classNum,
  };
}

export function getClassColor(grade: number, classNum: number): string {
  const palette = GRADE_TAILWIND_PALETTES[Math.max(0, grade - 1) % GRADE_TAILWIND_PALETTES.length];
  const shade = palette.shades[Math.max(0, classNum - 1) % palette.shades.length];
  return `${shade.bg} ${shade.text}`;
}

export function getClassColorTheme(className: string): ClassColorTheme {
  const { grade, classNum } = parseGradeAndClass(className);
  const palette = GRADE_TAILWIND_PALETTES[Math.max(0, grade - 1) % GRADE_TAILWIND_PALETTES.length];
  const shade = palette.shades[Math.max(0, classNum - 1) % palette.shades.length];

  return {
    badge: `${shade.bg} ${shade.text} ${palette.accentBorder}`,
    accentBorder: palette.accentBorder,
    dot: palette.dot,
    isDark: shade.isDark,
  };
}
