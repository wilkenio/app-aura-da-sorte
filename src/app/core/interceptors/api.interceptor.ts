import { HttpInterceptorFn } from '@angular/common/http';

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const updatedRequest = request.clone({
    setHeaders: {
      Accept: 'application/json',
    },
  });

  return next(updatedRequest);
};
