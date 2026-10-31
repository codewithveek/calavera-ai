export interface Tribute {
  id: number;
  profileId: number;
  profileName: string;
  profileRelation: string;
  profileLifeSpan: string;
  tone: number;
  figure: string;
  poem: string;
  modelLabel: string;
  tokensPerSecond: number | null;
  createdAt: number;
}

export type NewTribute = Pick<Tribute, 'profileId' | 'tone' | 'figure' | 'poem' | 'modelLabel' | 'tokensPerSecond'>;
