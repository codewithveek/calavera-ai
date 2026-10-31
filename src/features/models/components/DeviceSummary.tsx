import { formatBytes } from '@/shared/lib/format';
import { AppText } from '@/shared/ui/AppText';
import { Card } from '@/shared/ui/Card';

import type { DeviceProfile } from '../device';
import { MODEL_PACKS } from '../registry';

export function DeviceSummary({ device }: { device: DeviceProfile }) {
  return (
    <Card>
      <AppText variant="label" tone="muted">
        YOUR PHONE
      </AppText>
      <AppText variant="heading">{device.modelName}</AppText>
      <AppText tone="muted">
        {device.totalMemoryGiB.toFixed(1)} GB RAM · {formatBytes(device.freeDiskBytes)} free
      </AppText>
      <AppText>
        Recommended: <AppText tone="accent">{MODEL_PACKS[device.recommendedPackId].name}</AppText>
      </AppText>
    </Card>
  );
}
