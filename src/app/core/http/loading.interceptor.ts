import { HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

// Loading state interceptor for showing/hiding loading indicators
export const LoadingInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  // Skip intercepting requests that don't need loading indicator
  if (req.headers.get('skip-loading')) {
    return next(req);
  }

  return next(req).pipe(
    tap({
      complete: () => {
        // Loading completed - hide indicator
        console.log(`Loading complete for: ${req.url}`);
      },
      error: () => {
        // Loading failed - hide indicator (could show error notification)
        console.error(`Loading failed for: ${req.url}`);
      }
    })
  );
};