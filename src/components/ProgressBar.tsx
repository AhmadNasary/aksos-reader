import { View } from 'react-native';
import { colors } from '../theme';

export function ProgressBar({
  value,
  color = colors.brand,
  track = colors.border,
  height = 3,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` as const;
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: pct, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}
