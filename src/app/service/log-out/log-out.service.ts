import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LogOutService {

  constructor(private router: Router) {}

  logout(): void{
    // Xóa token thông tin đăng nhập
    //localStorage.removeItem('access_token');

    // Chuyển hướng về trang login
    this.router.navigate(['']);
  }
}
