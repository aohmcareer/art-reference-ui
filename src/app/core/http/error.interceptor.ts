import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpEvent
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Global error interceptor for handling HTTP errors
export const ErrorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', {
        url: req.url,
        status: error.status,
        statusText: error.statusText,
        message: error.message
      });

      // You can add custom error handling here based on status codes
      switch (error.status) {
        case 404:
          console.warn('Resource not found:', req.url);
          break;
        case 500:
          console.error('Server error:', req.url);
          break;
      }

      return throwError(() => new HttpErrorResponse({
        error: error.error,
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined
      }));
    })
  );
};