import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { Product } from '../models/product';
import { environment } from '../../../environments/environment';
import { QueryPagination } from '../models/queryPagination';
import { ResponsePagination } from '../models/responsePagination';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private getProductsUrl: string = `${environment.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/dynamic-worker`;
  private getCategoriesUrl: string = `${environment.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bright-worker`;
  private createProductUrl: string = `${environment.NEXT_PUBLIC_SUPABASE_URL}products/store`;
  private updateProductUrl: string = `${environment.NEXT_PUBLIC_SUPABASE_URL}products/update/`;
  private deleteProductUrl: string = `${environment.NEXT_PUBLIC_SUPABASE_URL}products/delete`;

  constructor(private http: HttpClient) {}

  public getProducts(query: QueryPagination): Observable<ResponsePagination<Product[]>> {
    let httpParams = new HttpParams()
      .set('page', String(query.page))
      .set('limit', String(query.limit));

    if (query.search) {
      httpParams = httpParams.set('search', query.search);
    }

    if (query.category) {
      httpParams = httpParams.set('category', query.category);
    }

    const options = httpParams
      ? { params: httpParams, headers: new HttpHeaders() }
      : { headers: new HttpHeaders() };

    return this.http
      .get<ResponsePagination<Product[]>>(this.getProductsUrl, options)
      .pipe(catchError(this.handleError));
  }

  public getCategories(): Observable<{ data: string[] }> {
    return this.http
      .get<{ data: string[] }>(this.getCategoriesUrl, { headers: new HttpHeaders() })
      .pipe(catchError(this.handleError));
  }

  public createProduct(form: FormData): Observable<any> {
    return this.http.post<any>(this.createProductUrl, form).pipe(catchError(this.handleError));
  }

  public updateProduct(form: FormData, id: number): Observable<any> {
    return this.http
      .patch<any>(this.updateProductUrl + id, form)
      .pipe(catchError(this.handleError));
  }

  public deleteProduct(id: number, url_image: string): Observable<any> {
    const query: any = {
      id: id,
      url_image: url_image,
    };
    const httpParams = new HttpParams().appendAll({ ...query });
    const options = httpParams
      ? { params: httpParams, headers: new HttpHeaders() }
      : { headers: new HttpHeaders() };

    return this.http.delete<any>(this.deleteProductUrl, options).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error.error.message || 'Ocurrió un error');
  }
}
