import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private router: Router) { }

  login(): void{

    // Chuyển hướng về trang login
    //this.router.navigate(['/dashboard-super-admin']);
    this.router.navigate(['/dashboard-tenant']);
  }
}
