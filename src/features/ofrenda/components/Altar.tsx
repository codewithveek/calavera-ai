import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/shared/theme/tokens';

import { useOfrendaByTier } from '../hooks';
import { TIER_ORDER } from '../tiers';
import type { OfrendaItem } from '../types';
import { AltarTier } from './AltarTier';
import { Candle } from './Candle';
import { OfrendaItemSheet } from './OfrendaItemSheet';

const CANDLES = [
  { height: 34, phaseMs: 0 },
  { height: 46, phaseMs: 90 },
  { height: 28, phaseMs: 40 },
  { height: 40, phaseMs: 140 },
];

/** The digital three-tier ofrenda. Empty slots open the Soul Mirror. */
export function Altar() {
  const router = useRouter();
  const { data: tiers } = useOfrendaByTier();
  const [selected, setSelected] = useState<OfrendaItem | null>(null);

  return (
    <View style={styles.altar}>
      {TIER_ORDER.map((tier) => (
        <AltarTier
          key={tier}
          tier={tier}
          items={tiers?.[tier] ?? []}
          onItemPress={setSelected}
          onEmptyPress={() => router.push('/mirror')}
        />
      ))}
      <View style={styles.candles}>
        {CANDLES.map((candle, index) => (
          <Candle key={index} height={candle.height} phaseMs={candle.phaseMs} />
        ))}
      </View>
      <OfrendaItemSheet item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  altar: { gap: spacing.md },
  candles: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingTop: spacing.md },
});
