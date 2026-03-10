export interface ResponsePagination<T> {
  data: T;
  pagination: Pagination;
}

export interface Pagination {
  total_records: number;
  current_page: number;
  limit: number;
  next_page: number | null;
}
