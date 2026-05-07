export interface Promotion {
  id: number;
  title: string;
  description: string;
  file?: string | null;
  percent: number;
  idsProds: number[] | string[] | string | null;
  created_at: string;
  updated_at: string;
}