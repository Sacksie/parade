import { Text, type TextProps } from 'react-native';

import { type } from '@/theme/tokens';

type Props = TextProps & { size?: 'small' | 'base' | 'large' | 'hero'; semi?: boolean };

/** Text for numbers: distances, times, counts. Geist Mono, tabular. */
export function Mono({ size = 'base', style, ...rest }: Props) {
  const preset = size === 'small' ? type.monoSmall : size === 'large' ? type.monoLarge : size === 'hero' ? type.monoHero : type.mono;
  return <Text {...rest} style={[preset, style]} />;
}
