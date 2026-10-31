import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { toErrorMessage } from '@/shared/lib/errors';
import { haptics } from '@/shared/lib/haptics';
import { colors, radii, spacing } from '@/shared/theme/tokens';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { EmptyState, LoadingState } from '@/shared/ui/States';

import type { PreparedImage } from '../imagePrep';

interface CameraCaptureProps {
  onCaptured: (photo: PreparedImage) => void;
}

export function CameraCapture({ onCaptured }: CameraCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) onCaptured({ uri: asset.uri, width: asset.width, height: asset.height });
  };

  const takePhoto = async () => {
    try {
      haptics.tap();
      const photo = await camera.current?.takePictureAsync({ quality: 0.7 });
      if (photo) onCaptured({ uri: photo.uri, width: photo.width, height: photo.height });
    } catch (captureError) {
      setError(toErrorMessage(captureError, 'The camera could not take a photo.'));
    }
  };

  if (!permission) return <LoadingState />;

  if (!permission.granted) {
    return (
      <EmptyState
        glyph="📷"
        title="Let the mirror see"
        body="The Soul Mirror needs your camera to identify heirlooms. Photos are analysed on this phone and never uploaded."
        action={
          <View style={styles.permissionActions}>
            <Button label="Allow camera" onPress={requestPermission} />
            <Button label="Choose from gallery" variant="secondary" onPress={pickFromGallery} />
          </View>
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.frame}>
        <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setReady(true)} />
        <View style={styles.reticle} pointerEvents="none" />
      </View>
      <AppText tone="muted" center>
        Frame a single heirloom: a photo, a cup, a candle, their favourite hat.
      </AppText>
      {error ? (
        <AppText tone="danger" center>
          {error}
        </AppText>
      ) : null}
      <View style={styles.controls}>
        <Button label="Gallery" icon="🖼️" variant="secondary" onPress={pickFromGallery} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          accessibilityState={{ disabled: !ready }}
          disabled={!ready}
          onPress={takePhoto}
          style={({ pressed }) => [styles.shutter, pressed && styles.shutterPressed, !ready && styles.disabled]}
        >
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const SHUTTER = 72;

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md },
  frame: { flex: 1, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.nightSunken },
  reticle: {
    position: 'absolute',
    top: '15%',
    left: '12%',
    right: '12%',
    bottom: '15%',
    borderWidth: 2,
    borderColor: colors.marigold,
    borderRadius: radii.lg,
    opacity: 0.7,
  },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutter: {
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: SHUTTER / 2,
    borderWidth: 4,
    borderColor: colors.bone,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: SHUTTER - 18, height: SHUTTER - 18, borderRadius: (SHUTTER - 18) / 2, backgroundColor: colors.marigold },
  shutterPressed: { transform: [{ scale: 0.94 }] },
  disabled: { opacity: 0.4 },
  spacer: { width: 96 },
  permissionActions: { gap: spacing.sm, alignSelf: 'stretch' },
});
