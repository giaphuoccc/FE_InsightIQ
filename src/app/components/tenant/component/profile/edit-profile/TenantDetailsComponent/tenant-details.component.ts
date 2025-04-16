import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // 🟢 Quan trọng
import { FormsModule } from '@angular/forms'; // 🟢 Cho ngModel

@Component({
  selector: 'app-tenant-details',
  standalone: true,
  templateUrl: './tenant-details.component.html',
  styleUrls: ['./tenant-details.component.css'],
  imports: [CommonModule, FormsModule], // 🟢 Cái này phải nằm trong @Component!
})
export class TenantDetailsComponent {
  isEditing = false;

  user = {
    name: 'John Doe',
    phone: '0903331312',
    email: 'jhondoe1.com',
    businessName: 'ABC Group',
    website: 'abcgroup.com',
    taxCode: '090900123',
    profession: 'Business',
    address: '999 Tran Hung Dao',
    sector: 'Technology',
  };

  private originalUser = { ...this.user };

  toggleEdit() {
    this.originalUser = { ...this.user };
    this.isEditing = true;
  }

  cancel() {
    this.user = { ...this.originalUser };
    this.isEditing = false;
  }

  update() {
    if (!this.validateEmail(this.user.email)) {
      alert('*Emails must follow a standard format (e.g. name@example.com)');
      return;
    }

    // Nếu hợp lệ
    console.log('Updated user:', this.user);
    this.isEditing = false;
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}
