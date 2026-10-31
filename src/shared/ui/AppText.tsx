import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fontSizes, fonts } from '@/shared/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
type Tone = 'default' | 'muted' | 'accent' | 'danger' | 'success';

interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  serif?: boolean;
  center?: boolean;
}

export function AppText({ variant = 'body', tone = 'default', serif, center, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        styles[variant],
        toneStyles[tone],
        serif && styles.serif,
        center && styles.center,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: colors.bone, fontSize: fontSizes.body, lineHeight: 22 },
  display: { fontSize: fontSizes.display, lineHeight: 42, fontWeight: '700', fontFamily: fonts.serif },
  title: { fontSize: fontSizes.title, lineHeight: 34, fontWeight: '700', fontFamily: fonts.serif },
  heading: { fontSize: fontSizes.heading, lineHeight: 26, fontWeight: '700' },
  body: {},
  label: { fontSize: fontSizes.label, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: fontSizes.caption, lineHeight: 16 },
  serif: { fontFamily: fonts.serif },
  center: { textAlign: 'center' },
});

const toneStyles = StyleSheet.create({
  default: {},
  muted: { color: colors.textMuted },
  accent: { color: colors.marigold },
  danger: { color: colors.danger },
  success: { color: colors.success },
});
