import { Circle, G, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { Px } from '@/data/mockTown';
import { destination } from '@/lib/geo';
import { colors, font } from '@/theme/tokens';
import type { LatLng, Stop } from '@/types';

import { toWorld } from './camera';

/**
 * Everything drawn on top of the basemap, in world px. Sizes are given in screen px and divided by
 * zoom (`u`) so markers stay the same size on screen at any zoom, as in the design mockups.
 */

export type OverlayCar = { id: string; at: Px; role: 'car' | 'lead' | 'tail'; isMe?: boolean; alert?: boolean };

type Props = {
  zoom: number;
  rotation: number;
  route?: Px[];
  routeStyle: 'draft' | 'live';
  behind?: Px[];
  ahead?: Px[];
  stops?: Stop[];
  showStopRadius?: boolean;
  stopLabels?: boolean;
  meetingPoint?: Px;
  cars?: OverlayCar[];
  heading?: number;
  pin?: Px;
  splitPath?: Px[];
  split?: Px;
};

const pts = (p: Px[]) => p.map((q) => `${q.x},${q.y}`).join(' ');

export function MapOverlays(props: Props) {
  const u = 1 / props.zoom;
  const upright = (p: Px) => (props.rotation ? `rotate(${props.rotation}, ${p.x}, ${p.y})` : undefined);
  const { route, routeStyle } = props;

  return (
    <G>
      {/* Route */}
      {route && route.length > 1 && routeStyle === 'draft' ? (
        <G>
          <Polyline points={pts(route)} fill="none" stroke={colors.mint} strokeOpacity={0.16} strokeWidth={11 * u} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points={pts(route)} fill="none" stroke={colors.mint} strokeWidth={4.5 * u} strokeLinecap="round" strokeLinejoin="round" />
          {route.slice(1, -1).map((p, i) => (
            <Circle key={`v${i}`} cx={p.x} cy={p.y} r={5.5 * u} fill={colors.white} stroke={colors.onyx} strokeWidth={2 * u} />
          ))}
          <Circle cx={route[route.length - 1].x} cy={route[route.length - 1].y} r={17 * u} fill={colors.mint} fillOpacity={0.14} />
          <EndBadge at={route[0]} label="S" u={u} transform={upright(route[0])} />
          <EndBadge at={route[route.length - 1]} label="F" u={u} transform={upright(route[route.length - 1])} />
        </G>
      ) : null}
      {routeStyle === 'live' && props.behind && props.behind.length > 1 ? (
        <Polyline points={pts(props.behind)} fill="none" stroke={colors.indigoBorder} strokeWidth={5 * u} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {routeStyle === 'live' && props.ahead && props.ahead.length > 1 ? (
        <G>
          <Polyline points={pts(props.ahead)} fill="none" stroke={colors.mint} strokeOpacity={0.16} strokeWidth={15 * u} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points={pts(props.ahead)} fill="none" stroke={colors.mint} strokeWidth={5 * u} strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ) : null}

      {/* Split: amber dashes along the gap, plus a marker */}
      {props.splitPath && props.splitPath.length > 1 ? (
        <Polyline points={pts(props.splitPath)} fill="none" stroke={colors.warn} strokeWidth={3 * u} strokeDasharray={`${3 * u} ${7 * u}`} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}

      {/* Stops */}
      {props.stops?.map((s) => {
        const at = toWorld(s.position);
        const edge = toWorld(destination(s.position, 90, s.radiusM));
        const r = Math.hypot(edge.x - at.x, edge.y - at.y);
        const label = s.name;
        const w = (label.length * 6.4 + 22) * u;
        return (
          <G key={s.id}>
            {props.showStopRadius ? (
              <Circle cx={at.x} cy={at.y} r={r} fill={colors.mint} fillOpacity={0.07} stroke={colors.mint} strokeWidth={1.4 * u} strokeDasharray={`${4 * u} ${4 * u}`} />
            ) : null}
            <G transform={upright(at)}>
              <Circle cx={at.x} cy={at.y} r={9 * u} fill={colors.white} stroke={colors.onyx} strokeWidth={2 * u} />
              <SvgText x={at.x} y={at.y + 3.8 * u} textAnchor="middle" fontFamily={font.monoSemi} fontSize={11 * u} fontWeight="600" fill={colors.onyx}>
                {String(s.seq)}
              </SvgText>
              {props.stopLabels ? (
                <G>
                  <Rect x={at.x + 14 * u} y={at.y - 11 * u} width={w} height={22 * u} rx={11 * u} fill={colors.surface} stroke={colors.borderStrong} strokeWidth={1 * u} />
                  <SvgText x={at.x + 14 * u + w / 2} y={at.y + 4 * u} textAnchor="middle" fontFamily={font.sansSemi} fontSize={11 * u} fontWeight="600" fill={colors.text}>
                    {label}
                  </SvgText>
                </G>
              ) : null}
            </G>
          </G>
        );
      })}

      {props.meetingPoint ? <PinMark at={props.meetingPoint} u={u} color={colors.white} transform={upright(props.meetingPoint)} /> : null}

      {props.split ? (
        <G>
          <Circle cx={props.split.x} cy={props.split.y} r={13 * u} fill={colors.warn} fillOpacity={0.18} />
          <Circle cx={props.split.x} cy={props.split.y} r={6 * u} fill={colors.warnBg} stroke={colors.warn} strokeWidth={2.4 * u} />
        </G>
      ) : null}

      {props.cars ? <Cars cars={props.cars} u={u} heading={props.heading} /> : null}

      {props.pin ? <PinMark at={props.pin} u={u} color={colors.mint} big transform={upright(props.pin)} /> : null}
    </G>
  );
}

function EndBadge({ at, label, u, transform }: { at: Px; label: string; u: number; transform?: string }) {
  return (
    <G transform={transform}>
      <Circle cx={at.x} cy={at.y} r={8.5 * u} fill={colors.onyx} stroke={colors.mint} strokeWidth={2 * u} />
      <SvgText x={at.x} y={at.y + 3.6 * u} textAnchor="middle" fontFamily={font.sansBold} fontSize={10 * u} fontWeight="700" fill={colors.mint}>
        {label}
      </SvgText>
    </G>
  );
}

/** Teardrop pin with its tip on the point. */
function PinMark({ at, u, color, big, transform }: { at: Px; u: number; color: string; big?: boolean; transform?: string }) {
  const s = (big ? 1.25 : 1) * u;
  const r = 9 * s;
  const cy = at.y - 22 * s;
  const d = `M ${at.x} ${at.y} C ${at.x - 3 * s} ${cy + r + 2 * s}, ${at.x - r} ${cy + r * 0.6}, ${at.x - r} ${cy} A ${r} ${r} 0 1 1 ${at.x + r} ${cy} C ${at.x + r} ${cy + r * 0.6}, ${at.x + 3 * s} ${cy + r + 2 * s}, ${at.x} ${at.y} Z`;
  return (
    <G transform={transform}>
      <Circle cx={at.x} cy={at.y} r={3 * s} fill={colors.onyx} fillOpacity={0.5} />
      <Path d={d} fill={color} stroke={colors.onyx} strokeWidth={2 * u} />
      <Circle cx={at.x} cy={cy} r={3.6 * s} fill={colors.onyx} />
    </G>
  );
}

function Cars({ cars, u, heading }: { cars: OverlayCar[]; u: number; heading?: number }) {
  const plain = cars.filter((c) => c.role === 'car' && !c.isMe && !c.alert);
  const special = cars.filter((c) => !(c.role === 'car' && !c.isMe && !c.alert) && !c.isMe);
  const me = cars.find((c) => c.isMe);
  return (
    <G>
      <G fill={colors.indigo} stroke={colors.onyx} strokeWidth={1.6 * u}>
        {plain.map((c) => (
          <Circle key={c.id} cx={c.at.x} cy={c.at.y} r={5 * u} />
        ))}
      </G>
      {special.map((c) =>
        c.alert ? (
          <Circle key={c.id} cx={c.at.x} cy={c.at.y} r={7 * u} fill={colors.dangerSolid} stroke={colors.onyx} strokeWidth={2 * u} />
        ) : c.role === 'lead' ? (
          <Circle key={c.id} cx={c.at.x} cy={c.at.y} r={6.5 * u} fill={colors.white} stroke={colors.mint} strokeWidth={2.6 * u} />
        ) : (
          <Circle key={c.id} cx={c.at.x} cy={c.at.y} r={5.5 * u} fill={colors.onyx} stroke={colors.indigoBright} strokeWidth={2.4 * u} />
        ),
      )}
      {me ? <MeMark at={me.at} u={u} heading={heading} alert={me.alert} /> : null}
    </G>
  );
}

/** "You": white dot, mint ring, soft halo and a heading tick (L1). */
function MeMark({ at, u, heading, alert }: { at: Px; u: number; heading?: number; alert?: boolean }) {
  const ring = alert ? colors.warn : colors.mint;
  return (
    <G>
      <Circle cx={at.x} cy={at.y} r={14 * u} fill={ring} fillOpacity={0.18} />
      <Circle cx={at.x} cy={at.y} r={7 * u} fill={colors.white} stroke={ring} strokeWidth={2.6 * u} />
      {heading != null ? (
        <Path
          d={`M ${at.x} ${at.y - 16 * u} L ${at.x + 4.5 * u} ${at.y - 9.5 * u} L ${at.x - 4.5 * u} ${at.y - 9.5 * u} Z`}
          fill={ring}
          transform={`rotate(${heading}, ${at.x}, ${at.y})`}
        />
      ) : null}
    </G>
  );
}

/** World px of a LatLng list (helper for the canvas). */
export const worldLine = (line: LatLng[] | undefined) => line?.map(toWorld);
