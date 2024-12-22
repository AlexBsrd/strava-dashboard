import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {SessionService} from '../services/session.service';
import {tap} from 'rxjs/operators';

export const activityInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);

  return next(req).pipe(
    tap(() => {
      if (req.url.includes('strava.com')) {
        sessionService.updateActivity().subscribe();
      }
    })
  );
};
