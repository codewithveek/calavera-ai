import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme/tokens';

interface ScreenProps {
  children: ReactNode;
  /** Wraps content in a ScrollView. Use FlashList-based screens with `scroll={false}`. */
  scroll?: boolean;
  /** Screens under a native header only need the bottom inset. */
  edges?: Edge[];
  contentStyle?: ViewStyle;
  footer?: ReactNode;
}

export function Screen({ children, scroll = true, edges = ['bottom'], contentStyle, footer }: ScreenProps) {
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {/* Per Expo's guidance, Android needs no behavior; iOS needs padding. */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.night,
    gap: spacing.sm,
  },
});
