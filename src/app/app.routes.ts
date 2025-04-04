// app.routes.ts (Standalone approach)
import { Routes } from '@angular/router';
import { LoginComponent } from './modules/authentication/login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // ...other routes
];