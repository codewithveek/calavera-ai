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
      <AppText tone="muted">
        {device.totalMemoryGiB.toFixed(1)} GB of memory · {formatBytes(device.freeDiskBytes)} of free space
      </AppText>
      <AppText>
        Best for it: <AppText tone="accent">{MODEL_PACKS[device.recommendedPackId].name}</AppText>
      </AppText>
    </Card>
  );
}
