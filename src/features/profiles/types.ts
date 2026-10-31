export interface Profile {
  id: number;
  name: string;
  relation: string;
  lifeSpan: string;
  /** A short line about who they were: trade, habits, catchphrases. */
  essence: string;
  createdAt: number;
}

export interface ProfileSummary extends Profile {
  memoryCount: number;
  tributeCount: number;
}

export type ProfileDraft = Pick<Profile, 'name' | 'relation' | 'lifeSpan' | 'essence'>;
