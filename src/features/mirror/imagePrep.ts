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

/**
 * Where the scan waits while the model looks at it and the user decides. Not the cache: on a phone
 * short of space Android empties the cache, and a slow analysis gives it minutes to do so.
 */
function scanDirectory(): Directory {
  const directory = new Directory(Paths.document, 'scans');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
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

  // One scan is in flight at a time, so anything left here is a scan the user walked away from.
  const directory = scanDirectory();
  for (const entry of directory.list()) entry.delete();
  const scan = new File(saved.uri);
  scan.moveSync(new File(directory, `scan-${Date.now()}.jpg`));
  return { uri: scan.uri, width: saved.width, height: saved.height };
}

function ofrendaPhotoFile(): File {
  const directory = new Directory(Paths.document, 'ofrenda');
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return new File(directory, `heirloom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
}

/** Copies a scan onto the ofrenda once the user keeps it; the scan stays put so a failed save can be retried. */
export function persistOfrendaImage(scanUri: string): string {
  const target = ofrendaPhotoFile();
  // Sync: `copy()` is async in this SDK, and the caller stores the path right away.
  new File(scanUri).copySync(target);
  return target.uri;
}

/** Writes a heirloom photo restored from a backup (base64 JPEG). */
export async function saveOfrendaPhoto(base64: string): Promise<string> {
  const target = ofrendaPhotoFile();
  target.create();
  await target.write(base64, { encoding: 'base64' });
  return target.uri;
}

export function deleteImage(uri: string): void {
  const file = new File(uri);
  if (file.exists) file.delete();
}
