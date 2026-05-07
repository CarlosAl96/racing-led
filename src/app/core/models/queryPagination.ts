export interface QueryPagination {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  idDiscounts?: string;
  forDiscounts?: boolean;
}
