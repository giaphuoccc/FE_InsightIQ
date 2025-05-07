import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule]
})
export class LoginComponent implements OnInit {
  /** Reactive form for login */
  loginForm!: FormGroup;

  /** Flag to show validation errors only after first submit */
  submitted = false;

  /** Disable the form & show spinner while waiting for API */
  isSubmitting = false;

  /** API‑returned error message */
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  /** Shorthand getter used in the template: f['email'] */
  get f() {
    return this.loginForm.controls;
  }

  /** Handle the submit action */
  onSubmit(): void {
    this.submitted = true;

    // stop here if form is invalid or already submitting
    if (this.loginForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.loginError = null;

    const credentials = this.loginForm.value;

    // 🔐 Call your authentication endpoint (adjust URL as needed)
    this.http.post('/api/login', credentials).subscribe({
      next: () => {
        this.isSubmitting = false;
        // ✅ Navigate to dashboard or desired route after successful login
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isSubmitting = false;
        // ❌ Display error from backend or generic message
        this.loginError = error.error?.message || 'Login failed. Please try again.';
        // Smooth scroll to top so the user sees the error banner (if you add one)
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}
