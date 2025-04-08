import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RegisterViewModel, RegisterRequest } from '../viewmodels/register.viewmodel';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isSubmitting = false;
  registrationError: string | null = null;
  industries: string[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    private registerViewModel: RegisterViewModel,
    private router: Router
  ) {
    this.industries = this.registerViewModel.industries;
  }
  
  ngOnInit(): void {
    this.registerForm = this.registerViewModel.createForm();
    
    this.registerViewModel.isSubmitting$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSubmitting => {
        this.isSubmitting = isSubmitting;
      });
      
    this.registerViewModel.registrationError$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.registrationError = error;
        if (error) {
          // Scroll to top to show error message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }
  
  getErrorMessage(fieldName: string): string {
    return this.registerViewModel.getErrorMessage(fieldName, this.registerForm);
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
      return;
    }
    
    const formValue = this.registerForm.value;
    
    const registerData: RegisterRequest = {
      email: formValue.email,
      password: formValue.password,
      fullName: formValue.fullName,
      phone: formValue.phone,
      alternateContact: formValue.alternateContact || undefined,
      companyName: formValue.companyName,
      taxCode: formValue.taxCode,
      businessIndustry: formValue.businessIndustry,
      companyWebsite: formValue.companyWebsite || undefined,
      businessAddress: formValue.businessAddress,
      employeeCount: formValue.employeeCount
    };
    
    this.registerViewModel.register(registerData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.registerViewModel.handleSuccessfulRegistration(response);
        },
        error: () => {
          // Error is already handled in the view model
        }
      });
  }
}