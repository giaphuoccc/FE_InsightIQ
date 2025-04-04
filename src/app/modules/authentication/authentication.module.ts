// core/modules/authentication/auth.module.ts
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { 
        path: 'login', 
        component: LoginComponent,
        // Có thể thêm route guards tại đây nếu cần
      }
    ])
  ]
})
export class AuthModule { }