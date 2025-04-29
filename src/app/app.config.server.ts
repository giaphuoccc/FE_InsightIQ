// src/app/app.config.server.ts
import { importProvidersFrom } from '@angular/core';
import { BrowserModule }        from '@angular/platform-browser';
import { HttpClientModule }     from '@angular/common/http';
import { provideHttpClient }    from '@angular/common/http';
import { provideRouter }        from '@angular/router';
import { routes }               from './app.routes';

export const config = {
  providers: [
    // chỉ import BrowserModule, bỏ withServerTransition
    importProvidersFrom(BrowserModule),

    // HTTP client
    importProvidersFrom(HttpClientModule),
    provideHttpClient(),

    // Router với routes
    provideRouter(routes),

    // nếu bạn có các provider khác thì thêm ở đây…
  ]
};
