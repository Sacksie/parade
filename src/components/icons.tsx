import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/**
 * Icon set. 24×24 viewBox, 2 px round-capped strokes, as drawn in docs/design/screens.
 * Glyphs are data: stroked paths/circles/rects, plus a few filled shapes.
 */
type Glyph = {
  d?: string[];
  circles?: [number, number, number][];
  rects?: [number, number, number, number, number][];
  fillD?: string[];
  fillCircles?: [number, number, number][];
  fillRects?: [number, number, number, number, number][];
};

const GLYPHS = {
  close: { d: ['M6 6l12 12', 'M18 6L6 18'] },
  back: { d: ['M15 6l-6 6 6 6'] },
  chevronRight: { d: ['M9 6l6 6-6 6'] },
  chevronDown: { d: ['M6 9l6 6 6-6'] },
  arrowRight: { d: ['M5 12h14', 'M13 6l6 6-6 6'] },
  calendar: { rects: [[4, 5, 16, 15, 2]], d: ['M4 10h16', 'M9 3v4', 'M15 3v4'] },
  calendarAdd: { rects: [[4, 5, 16, 15, 2]], d: ['M4 10h16', 'M9 3v4', 'M15 3v4', 'M12 13v4', 'M10 15h4'] },
  plus: { d: ['M12 5v14', 'M5 12h14'] },
  minus: { d: ['M5 12h14'] },
  undo: { d: ['M9 14L4 9l5-5', 'M4 9h10a6 6 0 0 1 0 12h-3'] },
  search: { circles: [[11, 11, 6.5]], d: ['M20 20l-4.2-4.2'] },
  pin: { d: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z'], circles: [[12, 10, 2.5]] },
  map: { d: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'] },
  satellite: { circles: [[12, 12, 9]], d: ['M3 12h18', 'M12 3c3 3 3 15 0 18', 'M12 3c-3 3-3 15 0 18'] },
  layers: { d: ['M12 3l9 5-9 5-9-5 9-5z', 'M3 12.5l9 5 9-5', 'M3 16.5l9 5 9-5'] },
  music: { d: ['M9 18V5l11-2v13'], circles: [[6, 18, 3], [17, 16, 3]] },
  volume: { d: ['M11 5L6 9H3v6h3l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7'] },
  sound: { d: ['M11 5L6 9H3v6h3l5 4V5z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 5.5a9 9 0 0 1 0 13'] },
  mute: { d: ['M11 5L6 9H3v6h3l5 4V5z', 'M16 9.5l5 5', 'M21 9.5l-5 5'] },
  megaphone: { d: ['M4 10v4h3l9 5V5L7 10H4z', 'M19 9.5a3.5 3.5 0 0 1 0 5'] },
  mic: { rects: [[9, 3, 6, 11, 3]], d: ['M5 11a7 7 0 0 0 14 0', 'M12 18v3'] },
  send: { d: ['M4 12l16-8-6 16-2-7-8-1z'] },
  pause: { fillRects: [[6, 5, 4, 14, 1], [14, 5, 4, 14, 1]] },
  play: { fillD: ['M7 4.5v15l12-7.5-12-7.5z'] },
  next: { d: ['M5 5l10 7-10 7V5z', 'M19 5v14'] },
  previous: { d: ['M19 5l-10 7 10 7V5z', 'M5 5v14'] },
  phone: { d: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'] },
  message: { d: ['M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z'] },
  share: { d: ['M12 15V3', 'M7 8l5-5 5 5', 'M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7'] },
  upload: { d: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3'] },
  copy: { rects: [[8, 8, 12, 12, 2]], d: ['M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2'] },
  qr: { rects: [[4, 4, 6, 6, 1], [14, 4, 6, 6, 1], [4, 14, 6, 6, 1]], d: ['M14 14h2v2h-2z', 'M18 18h2v2h-2z', 'M14 18h2', 'M18 14h2'] },
  check: { d: ['M5 12.5l4.5 4.5L19 7.5'] },
  checkCircle: { circles: [[12, 12, 9]], d: ['M8 12.5l3 3 5-6'] },
  warning: { d: ['M12 3L2 20h20L12 3z', 'M12 10v4', 'M12 17.5v.01'] },
  help: { circles: [[12, 12, 9]], d: ['M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7', 'M12 17v.01'] },
  wrench: { d: ['M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z'] },
  split: { d: ['M3 12h5', 'M16 12h5', 'M8 7v10', 'M16 7v10'] },
  car: { d: ['M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11', 'M7.5 14.5h.01', 'M16.5 14.5h.01', 'M6 17v2', 'M18 17v2'], rects: [[3, 11, 18, 6, 2]] },
  turnLeft: { d: ['M17 20V11a3 3 0 0 0-3-3H6', 'M10 4L6 8l4 4'] },
  turnRight: { d: ['M7 20V11a3 3 0 0 1 3-3h8', 'M14 4l4 4-4 4'] },
  straight: { d: ['M12 20V5', 'M7 10l5-5 5 5'] },
  flag: { d: ['M5 21V4', 'M5 4h11l-2 4 2 4H5'] },
  clock: { circles: [[12, 12, 9]], d: ['M12 7v5l3 2'] },
  location: { circles: [[12, 12, 7], [12, 12, 2.5]], d: ['M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3'] },
  locationOff: { circles: [[12, 12, 7], [12, 12, 2.5]], d: ['M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3', 'M4 4l16 16'] },
  trash: { d: ['M4 7h16', 'M10 11v6', 'M14 11v6', 'M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12', 'M9 7V4h6v3'] },
  drag: { fillCircles: [[9, 6, 1.8], [15, 6, 1.8], [9, 12, 1.8], [15, 12, 1.8], [9, 18, 1.8], [15, 18, 1.8]] },
  star: { d: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z'] },
  lead: { d: ['M3 17l2-9 4.5 4L12 6l2.5 6L19 8l2 9H3z', 'M3 20h18'] },
  info: { circles: [[12, 12, 9]], d: ['M12 11v5', 'M12 8v.01'] },
  bell: { d: ['M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2z', 'M10 21h4'] },
  link: { d: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'] },
  edit: { d: ['M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z', 'M14 6l4 4'] },
  users: { circles: [[9, 8, 3.5], [17, 9, 2.5]], d: ['M2.5 20a6.5 6.5 0 0 1 13 0', 'M16 14.2a5 5 0 0 1 5.5 5.3'] },
  user: { circles: [[12, 8, 4]], d: ['M4 21a8 8 0 0 1 16 0'] },
  home: { d: ['M4 11l8-7 8 7', 'M6 9.5V20h12V9.5'] },
  wifi: { d: ['M2 9a15 15 0 0 1 20 0', 'M5.5 12.5a10 10 0 0 1 13 0', 'M9 16a5 5 0 0 1 6 0', 'M12 19.5v.01'] },
  download: { d: ['M12 4v12', 'M7 11l5 5 5-5', 'M5 20h14'] },
  lock: { rects: [[5, 11, 14, 10, 2]], d: ['M8 11V8a4 4 0 0 1 8 0v3'] },
  eye: { d: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'], circles: [[12, 12, 3]] },
  sun: { circles: [[12, 12, 4]], d: ['M12 2v3', 'M12 19v3', 'M2 12h3', 'M19 12h3', 'M5 5l2 2', 'M17 17l2 2', 'M19 5l-2 2', 'M7 17l-2 2'] },
  route: { circles: [[6, 19, 2.5], [18, 5, 2.5]], d: ['M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5'] },
  stop: { circles: [[12, 12, 9]], fillRects: [[9, 9, 6, 6, 1]] },
  ban: { circles: [[12, 12, 9]], d: ['M5.6 5.6l12.8 12.8'] },
  logout: { d: ['M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3', 'M10 8l-4 4 4 4', 'M6 12h10'] },
  refresh: { d: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5'] },
  smartphone: { rects: [[6, 2.5, 12, 19, 2.5]], d: ['M11 18.5h2'] },
  compass: { circles: [[12, 12, 9]], d: ['M15.5 8.5l-2 5-5 2 2-5 5-2z'] },
  chevronsDown: { d: ['M6 7l6 6 6-6', 'M6 13l6 6 6-6'] },
} satisfies Record<string, Glyph>;

export type IconName = keyof typeof GLYPHS;
export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 22, color = colors.text, strokeWidth = 2 }: IconProps) {
  const g: Glyph = GLYPHS[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" pointerEvents="none">
      {g.rects?.map(([x, y, w, h, r], i) => (
        <Rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={r} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {g.circles?.map(([cx, cy, r], i) => (
        <Circle key={`c${i}`} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {g.d?.map((d, i) => (
        <Path key={`d${i}`} d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {g.fillRects?.map(([x, y, w, h, r], i) => (
        <Rect key={`fr${i}`} x={x} y={y} width={w} height={h} rx={r} fill={color} />
      ))}
      {g.fillCircles?.map(([cx, cy, r], i) => (
        <Circle key={`fc${i}`} cx={cx} cy={cy} r={r} fill={color} />
      ))}
      {g.fillD?.map((d, i) => (
        <Path key={`fd${i}`} d={d} fill={color} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

/* Legacy wrappers, kept so existing screens compile. Prefer <Icon name=… />. */

export function CloseIcon({ size = 22, color = colors.text }: { size?: number; color?: string }) {
  return <Icon name="close" size={size} color={color} />;
}

export function PlusIcon({ size = 18, color = colors.mintInk }: { size?: number; color?: string }) {
  return <Icon name="plus" size={size} color={color} strokeWidth={2.4} />;
}

export function ChevronIcon({
  direction,
  size = 10,
  color = colors.text,
}: {
  direction: 'left' | 'right';
  size?: number;
  color?: string;
}) {
  return <Icon name={direction === 'left' ? 'back' : 'chevronRight'} size={Math.round(size * 2)} color={color} strokeWidth={2.2} />;
}

export function CalendarIcon({ color = colors.textMuted }: { color?: string }) {
  return <Icon name="calendar" size={22} color={color} />;
}

export function ArrowIcon({ color = colors.text }: { color?: string }) {
  return <Icon name="arrowRight" size={18} color={color} />;
}
