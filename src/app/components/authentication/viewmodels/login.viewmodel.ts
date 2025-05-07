import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class LoginViewModel {
  private _isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this._isLoading.asObservable();

  constructor(private router: Router) {}

  async login(email: string, password: string): Promise<void> {
    this._isLoading.next(true);
    
    try {
      // Mock authentication (replace with real API call later)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Login successful with:', { email, password });
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      this._isLoading.next(false);
    }
  }
}