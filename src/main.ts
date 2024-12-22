import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';
import {provideRouter} from '@angular/router';
import {routes} from './app/app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './app/interceptors/auth.interceptor';
import {provideAnimations} from "@angular/platform-browser/animations";
import {activityInterceptor} from "./app/interceptors/activity.interceptor";

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, activityInterceptor])
    ),
    provideAnimations()
  ]
}).catch(err => console.error(err));
