import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';
import {provideRouter} from '@angular/router';
import {routes} from './app/app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {authInterceptor} from './app/interceptors/auth.interceptor';
import {provideAnimations} from "@angular/platform-browser/animations";
import {activityInterceptor} from "./app/interceptors/activity.interceptor";
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, activityInterceptor])
    ),
    provideAnimations(),
    provideTranslateService({
      defaultLanguage: 'fr'
    }),
    provideTranslateHttpLoader({
      prefix: './assets/i18n/',
      suffix: '.json'
    })
  ]
}).catch(err => console.error(err));
