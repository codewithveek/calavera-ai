import type { OfrendaTier } from './tiers';

export interface OfrendaItem {
  id: number;
  profileId: number;
  profileName: string;
  memoryId: number | null;
  name: string;
  description: string;
  tier: OfrendaTier;
  meaning: string;
  imageUri: string;
  createdAt: number;
}
