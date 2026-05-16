export interface User {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
}

export interface Collection {
  id: number;
  name: string;
  owner_id: number;
  share_token: string | null;
}

export interface CollectionsResponse {
  owned: Collection[];
  shared: Collection[];
}

export interface Word {
  id: number;
  word: string;
  definition: string;
  notes: string;
  collection_id: number;
}
