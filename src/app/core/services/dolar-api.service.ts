import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

interface DolarApiOfficialResponse {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number | null;
  fechaActualizacion: string;
}

@Injectable({
  providedIn: 'root',
})
export class DolarAPIService {
  private readonly http = inject(HttpClient);
  private readonly officialRateUrl = 'https://ve.dolarapi.com/v1/dolares/oficial';

  public getOfficialRate(): Observable<DolarApiOfficialResponse> {
    return this.http
      .get<DolarApiOfficialResponse>(this.officialRateUrl)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    return throwError(() => error.error?.message || 'No se pudo obtener la tasa del dia');
  }
}
