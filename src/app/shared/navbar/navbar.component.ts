import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // ✅ CHÍNH XÁC
//import { LogOutService } from '../../service/log-out/log-out.service';
import { AuthService } from '../../core/auth.service';
import { NotificationComponent } from '../notification/notification.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  showLogoutConfirm = false;
  showLogErorr = false;
  errorMessage = 'Logout Failed. Please try again later.'; 

  //inject service log out vào
  constructor(private authService: AuthService) {};

  onSignOutClick() {
    this.showLogoutConfirm = true;
    this.showLogErorr = false; // Đảm bảo model lỗi đang ẩn
  }

  confirmLogout() {
    // this.showLogErorr = false; // Mô phỏng lỗi
    // this.showLogoutConfirm = false;
    this.authService.logout(); // Gọi hàm đăng xuất
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  confirmErrorLogout(){
    this.showLogErorr = false;
  }
}
