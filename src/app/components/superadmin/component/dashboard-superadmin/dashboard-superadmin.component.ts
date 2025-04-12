import { Component } from '@angular/core';
//import { NavbarComponent } from '../../../shared/navbar/navbar.component';
import { NavbarComponent } from '../../../../shared/navbar/navbar.component';
import { MainSuperadminDashboardComponent } from './main-superadmin-dashboard/main-superadmin-dashboard.component';

@Component({
  selector: 'dashboard-superadmin',
  imports: [NavbarComponent, MainSuperadminDashboardComponent],
  templateUrl: './dashboard-superadmin.component.html',
  styleUrl: './dashboard-superadmin.component.css'
})
export class DashboardSuperadminComponent {

}
