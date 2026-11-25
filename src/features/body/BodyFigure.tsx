import { StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import type { GroupId, GroupStatus } from '../../builder';
import { tokens } from '../../theme/tokens';
import { RECENCY_COLOR } from '../../ui/Panel';
import { DECOR, FIGURE_HEIGHT, FIGURE_WIDTH, REGIONS, type Side } from './regions';

const MIN_HIT_PX = 44;

/**
 * Front and back figures. Colour = recency, fill height = sets vs target, a dashed outline for never trained,
 * the selected group outlined. Each segment is its own tap target; small ones get a 44 x 44 px margin underneath.
 */
export function BodyFigure({ status, selected, onSelect, width = 130 }: {
  status: Record<GroupId, GroupStatus>; selected: GroupId | null; onSelect(g: GroupId): void; width?: number;
}) {
  return (
    <View style={styles.row}>
      {(['front', 'back'] as const).map(side => (
        <View key={side} style={styles.col}>
          <Figure side={side} status={status} selected={selected} onSelect={onSelect} width={width} />
          <Text style={styles.label}>{side === 'front' ? 'Front' : 'Back'}</Text>
        </View>
      ))}
    </View>
  );
}

function Figure({ side, status, selected, onSelect, width }: {
  side: Side; status: Record<GroupId, GroupStatus>; selected: GroupId | null; onSelect(g: GroupId): void; width: number;
}) {
  const scale = width / FIGURE_WIDTH;
  const hit = MIN_HIT_PX / scale;
  const regions = REGIONS.filter(r => r.side === side);
  const counter: Partial<Record<GroupId, number>> = {};
  const indexed = regions.map(r => {
    const k = counter[r.group] ?? 0;
    counter[r.group] = k + 1;
    return { ...r, k };
  });
  return (
    <Svg width={width} height={FIGURE_HEIGHT * scale} viewBox={`0 0 ${FIGURE_WIDTH} ${FIGURE_HEIGHT}`}>
      <Defs>
        {indexed.map(r => {
          const s = status[r.group];
          const f = s.target > 0 ? Math.min(1, s.sets / s.target) : 0;
          return (
            <ClipPath key={`${r.group}-${r.k}`} id={`clip-${side}-${r.group}-${r.k}`}>
              <Rect x={r.bounds.x} y={r.bounds.y + r.bounds.h * (1 - f)} width={r.bounds.w} height={r.bounds.h * f} />
            </ClipPath>
          );
        })}
      </Defs>
      {DECOR.filter(d => d.side === side).map((d, i) => <Path key={i} d={d.path} fill={tokens.color.sch} />)}
      {indexed.map(r => {
        const s = status[r.group];
        const never = s.recency === 'never';
        const color = never ? tokens.color.rest : RECENCY_COLOR[s.recency];
        const isSelected = selected === r.group;
        return (
          <G key={`${r.group}-${r.k}`}>
            <Path
              d={r.path}
              fill={tokens.color.empty}
              stroke={isSelected ? tokens.color.on : never ? tokens.color.ol : 'none'}
              strokeWidth={isSelected ? 2 / scale : 1 / scale}
              strokeDasharray={never && !isSelected ? '3 2' : undefined}
            />
            <Path d={r.path} fill={color} clipPath={`url(#clip-${side}-${r.group}-${r.k})`} />
          </G>
        );
      })}
      {/* Enlarged margins for small segments sit underneath, so they only catch taps beside a segment. */}
      {indexed.filter(r => r.bounds.w < hit || r.bounds.h < hit).map(r => {
        const w = Math.max(r.bounds.w, hit);
        const h = Math.max(r.bounds.h, hit);
        return (
          <Rect
            key={`grow-${r.group}-${r.k}`}
            testID={`grow-${side}-${r.group}-${r.k}`}
            x={r.bounds.x + r.bounds.w / 2 - w / 2}
            y={r.bounds.y + r.bounds.h / 2 - h / 2}
            width={w}
            height={h}
            fill="transparent"
            onPress={() => onSelect(r.group)}
          />
        );
      })}
      {/* Each visible segment is its own target, on top: a tap on the shoulder cap always opens Shoulders. */}
      {indexed.map(r => (
        <Path
          key={`hit-${r.group}-${r.k}`}
          testID={`hit-${side}-${r.group}-${r.k}`}
          d={r.path}
          fill="transparent"
          onPress={() => onSelect(r.group)}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  col: { alignItems: 'center', gap: tokens.space.sm },
  label: { color: tokens.color.onv, fontSize: tokens.font.size.body },
});
