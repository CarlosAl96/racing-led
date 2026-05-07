import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { QueryPagination } from '../models/queryPagination';
import { ResponsePagination } from '../models/responsePagination';
import { Promotion } from '../models/promotion';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class PromotionsService {
  private readonly http = inject(HttpClient);

  private readonly createPromotionUrl = `${environment.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/smooth-processor`;
  private readonly updatePromotionUrl = `${environment.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/quick-task/`;
  private readonly deletePromotionUrl = `${environment.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/super-processor/`;
  private readonly getPromotionsUrl = `${environment.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hyper-api`;

  public getPromotions(
    query: Pick<QueryPagination, 'page' | 'limit' | 'search'>,
  ): Observable<ResponsePagination<Promotion[]>> {
    let httpParams = new HttpParams()
      .set('page', String(query.page))
      .set('limit', String(query.limit));

    if (query.search) {
      httpParams = httpParams.set('search', query.search);
    }

    return this.http
      .get<ResponsePagination<Promotion[]>>(this.getPromotionsUrl, {
        params: httpParams,
        headers: new HttpHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  public createPromotion(form: FormData): Observable<unknown> {
    return this.http
      .post<unknown>(this.createPromotionUrl, form)
      .pipe(catchError(this.handleError));
  }

  public updatePromotion(form: FormData, id: number): Observable<unknown> {
    return this.http
      .put<unknown>(this.updatePromotionUrl + id, form)
      .pipe(catchError(this.handleError));
  }

  public deletePromotion(id: number): Observable<unknown> {
    return this.http
      .delete<unknown>(this.deletePromotionUrl + id)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.error.message || 'Ocurrió un error');
  }
}
