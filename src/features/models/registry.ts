/**
 * Open-weight models used by Calavera AI. Sizes and SHA-256 digests are the
 * Hugging Face LFS values, so every download is verified byte-for-byte.
 */

export type ModelFileId =
  | 'gemma2-2b-it-q4km'
  | 'smolvlm-500m-q8'
  | 'smolvlm-500m-mmproj-q8'
  | 'gemma4-e2b-it-q4'
  | 'gemma4-e2b-mmproj-q8'
  | 'minilm-l6-v2-q8';

export interface ModelFile {
  id: ModelFileId;
  label: string;
  repo: string;
  fileName: string;
  sizeBytes: number;
  sha256: string;
}

export type ModelPackId = 'lite' | 'standard';

export interface ModelPack {
  id: ModelPackId;
  name: string;
  tagline: string;
  /** Device RAM (GiB, as reported by the OS) this pack is tuned for. */
  minRamGiB: number;
  /** Human-readable model names, shown in the UI and saved with each tribute. */
  textModelLabel: string;
  visionModelLabel: string;
  text: ModelFileId;
  vision: { model: ModelFileId; projector: ModelFileId };
  embedding: ModelFileId;
}

/** all-MiniLM-L6-v2 produces 384-dimensional sentence embeddings. */
export const EMBEDDING_DIMENSIONS = 384;

export const MODEL_FILES: Record<ModelFileId, ModelFile> = {
  'gemma2-2b-it-q4km': {
    id: 'gemma2-2b-it-q4km',
    label: 'Gemma 2 2B Instruct (Q4_K_M)',
    repo: 'bartowski/gemma-2-2b-it-GGUF',
    fileName: 'gemma-2-2b-it-Q4_K_M.gguf',
    sizeBytes: 1_708_582_752,
    sha256: 'e0aee85060f168f0f2d8473d7ea41ce2f3230c1bc1374847505ea599288a7787',
  },
  'smolvlm-500m-q8': {
    id: 'smolvlm-500m-q8',
    label: 'SmolVLM 500M Instruct (Q8_0)',
    repo: 'ggml-org/SmolVLM-500M-Instruct-GGUF',
    fileName: 'SmolVLM-500M-Instruct-Q8_0.gguf',
    sizeBytes: 436_806_912,
    sha256: '9d4612de6a42214499e301494a3ecc2be0abdd9de44e663bda63f1152fad1bf4',
  },
  'smolvlm-500m-mmproj-q8': {
    id: 'smolvlm-500m-mmproj-q8',
    label: 'SmolVLM vision projector (Q8_0)',
    repo: 'ggml-org/SmolVLM-500M-Instruct-GGUF',
    fileName: 'mmproj-SmolVLM-500M-Instruct-Q8_0.gguf',
    sizeBytes: 108_783_360,
    sha256: 'd1eb8b6b23979205fdf63703ed10f788131a3f812c7b1f72e0119d5d81295150',
  },
  'gemma4-e2b-it-q4': {
    id: 'gemma4-e2b-it-q4',
    label: 'Gemma 4 E2B Instruct (Q4_0)',
    repo: 'ggml-org/gemma-4-E2B-it-GGUF',
    fileName: 'gemma-4-E2B-it-Q4_0.gguf',
    sizeBytes: 2_841_481_184,
    sha256: '8e30dff3ac4c8434c49a7036fa15564bdbb6044e42bf04550bf1a096ad7e6a52',
  },
  'gemma4-e2b-mmproj-q8': {
    id: 'gemma4-e2b-mmproj-q8',
    label: 'Gemma 4 vision projector (Q8_0)',
    repo: 'ggml-org/gemma-4-E2B-it-GGUF',
    fileName: 'mmproj-gemma-4-E2B-it-Q8_0.gguf',
    sizeBytes: 557_368_064,
    sha256: '9406f99c16d68cda4f1f0552192dcc99021ea1fc6d2fd50b1dc3ccf30d04b292',
  },
  'minilm-l6-v2-q8': {
    id: 'minilm-l6-v2-q8',
    label: 'all-MiniLM-L6-v2 embeddings (Q8_0)',
    repo: 'second-state/All-MiniLM-L6-v2-Embedding-GGUF',
    fileName: 'all-MiniLM-L6-v2-Q8_0.gguf',
    sizeBytes: 25_008_064,
    sha256: '263215c3cadd6e16740741a7624ab4cbb6c8e777688bd5331ecfbf5681c2f8ed',
  },
};

export const MODEL_PACKS: Record<ModelPackId, ModelPack> = {
  lite: {
    id: 'lite',
    name: 'Ofrenda Lite',
    tagline: 'Gemma 2 2B writes, SmolVLM sees. Tuned for 4–5 GB phones.',
    minRamGiB: 3.5,
    textModelLabel: 'Gemma 2 2B',
    visionModelLabel: 'SmolVLM 500M',
    text: 'gemma2-2b-it-q4km',
    vision: { model: 'smolvlm-500m-q8', projector: 'smolvlm-500m-mmproj-q8' },
    embedding: 'minilm-l6-v2-q8',
  },
  standard: {
    id: 'standard',
    name: 'Ofrenda Gemma 4',
    tagline: 'One multimodal Gemma 4 E2B writes and sees. For 6 GB+ phones.',
    minRamGiB: 5.4,
    textModelLabel: 'Gemma 4 E2B',
    visionModelLabel: 'Gemma 4 E2B',
    text: 'gemma4-e2b-it-q4',
    vision: { model: 'gemma4-e2b-it-q4', projector: 'gemma4-e2b-mmproj-q8' },
    embedding: 'minilm-l6-v2-q8',
  },
};

export const PACK_ORDER: readonly ModelPackId[] = ['lite', 'standard'];

export function modelUrl(file: ModelFile): string {
  return `https://huggingface.co/${file.repo}/resolve/main/${file.fileName}`;
}

/** Unique files a pack needs (text and vision may share one model). */
export function packFiles(pack: ModelPack): ModelFile[] {
  const ids = new Set<ModelFileId>([pack.text, pack.vision.model, pack.vision.projector, pack.embedding]);
  return [...ids].map((id) => MODEL_FILES[id]);
}

export function packSizeBytes(pack: ModelPack): number {
  return packFiles(pack).reduce((total, file) => total + file.sizeBytes, 0);
}
