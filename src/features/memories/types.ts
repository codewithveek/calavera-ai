export type MemorySource = 'story' | 'heirloom';

export interface Memory {
  id: number;
  profileId: number;
  source: MemorySource;
  body: string;
  createdAt: number;
}

export interface MemoryMatch {
  chunkId: number;
  memoryId: number;
  profileId: number;
  profileName: string;
  content: string;
  /** Cosine similarity in [−1, 1]; higher is closer. */
  similarity: number;
}
