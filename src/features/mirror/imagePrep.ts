import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Vision encoders work on ~512px tiles. Downscaling before inference cuts
 * image tokens, prefill time and peak memory, and gives us a small thumbnail
 * to keep instead of a 12 MP photo.
 */
const TARGET_LONG_EDGE = 512;

export interface PreparedImage {
  uri: string;
  width: number;
  height: number;
}

export async function prepareForVision(source: PreparedImage): Promise<PreparedImage> {
  const landscape = source.width >= source.height;
  const resize = landscape ? { width: TARGET_LONG_EDGE } : { height: TARGET_LONG_EDGE };
  const needsResize = Math.max(source.width, source.height) > TARGET_LONG_EDGE;

  const context = ImageManipulator.manipulate(source.uri);
  if (needsResize) context.resize(resize);
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  rendered.release();
  context.release();
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/** Moves a scan out of the evictable cache once the user keeps it. */
export function persistOfrendaImage(cacheUri: string): string {
  const directory = new Directory(Paths.document, 'ofrenda');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  const target = new File(directory, `heirloom-${Date.now()}.jpg`);
  new File(cacheUri).copy(target);
  return target.uri;
}

export function deleteImage(uri: string): void {
  const file = new File(uri);
  if (file.exists) file.delete();
}
