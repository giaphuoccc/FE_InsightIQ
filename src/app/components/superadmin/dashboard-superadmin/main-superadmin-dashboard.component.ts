import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DashboardActionButtonComponent } from './dashboard-action-button/dashboard-action-button.component';

@Component({
  selector: 'main-superadmin-dashboard',
  standalone: true,
  imports: [RouterModule, DashboardActionButtonComponent],
  templateUrl: './main-superadmin-dashboard.component.html',
  styleUrl: './main-superadmin-dashboard.component.css'
})
export class MainSuperadminDashboardComponent {
  constructor(private router: Router) {}

  goto(path: string): void {
    this.router.navigate([path]);
  }
}
