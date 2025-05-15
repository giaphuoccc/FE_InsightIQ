import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // for ngModel binding
import { Router } from '@angular/router';

import {
  TenantAccountListService,
  TenantDTO,
} from '../../../service/superAdmin/tenantAccountList.service';
import { TenantAccountDetailsComponent } from '../tenantAccountDetails/tenantAccountDetails.component';
import { forkJoin, of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';

export interface Tenant {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  businessName: string;
  isBlocked: boolean;
  userId: number;
  status?: string;
  taxId: string;
}

@Component({
  selector: 'app-tenant-account-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenantAccountList.component.html',
  styleUrls: ['./tenantAccountList.component.css'],
})
export class TenantAccountListComponent implements OnInit {
  tenants: Tenant[] = []; // Khởi tạo mảng rỗng

  isLoading: boolean = true; // Dùng để hiển thị trạng thái Loading

  searchTerm: string = ''; //Biến dùng để lưu nội dung người dùng nhập vào

  showConfirmModal = false; //Biến điều khiển việc hiển thị modal xác nhận hành động

  showResultModal = false; //Biến điều khiển việc hiển thị modal kết quả

  selectedTenant: Tenant | null = null; // Biến lưu Tenant đang được chọn

  actionType: 'block' | 'unblock' | 'delete' = 'block'; // Biến lưu hành động tenant hiện tại, mặc định là block

  resultMessage = ''; //Biến lưu thông báo kết quả sau khi thực hiện hành động

  // Inject service vào
  constructor(
    private tenantService: TenantAccountListService,
    private router: Router
  ) {}

  // Hàm ngOnIt
  ngOnInit(): void {
    this.loadTenantWithDetails(); //Gọi hàm load dữ liệu sau khi chạy contructor
  }

  // Phương thức gọi dữ liệu để lấy tất cả Tenant, xong rồi nó sẽ lấy chi tiết từng user và ghép chúng lại
  loadTenantWithDetails(): void {
    this.isLoading = true; // Bắt đầu chạy loading

    this.tenantService
      .getAllTenant()
      .pipe(
        //Gọi API lấy danh sách Tenant cơ bản
        mergeMap((basicTenantFromApi: any[]) => {
          // basicTenantFromApi là mảng các Tenant nhưng chưa có email với phone number

          if (!basicTenantFromApi || basicTenantFromApi.length === 0) {
            // Trường hợp k có Tenant nào
            this.isLoading = false;
            this.tenants = [];
            return of([]);
          }

          // Tạo 1 mảng các observable để gọi API lấy user detail với Tenant tương ứng
          const tenantDetailObservables = basicTenantFromApi
            .filter(
              (tenantApiData) =>
                tenantApiData.status === 'APPROVED' ||
                tenantApiData.status === 'DISABLED'
            )
            .map((tenantApiData) => {
              // API trả về: id, companyName, fullName, taxId, status, userId
              // Interface Tenant đang là: id, name, email, phone, businessName, isBlocked, userId, status
              // Nhận userId
              const currentUserId = tenantApiData.userId;

              // Kiểm tra nếu userId không phải là 1 số hợp lệ thì sẽ không trả về email với phone number
              if (typeof currentUserId !== 'number' || isNaN(currentUserId)) {
                return of({
                  id: tenantApiData.id,
                  name: tenantApiData.fullName,
                  email: 'N/A (Invalid UserID)',
                  phone: 'N/A (Invalid UserID)',
                  businessName: tenantApiData.companyName,
                  isBlocked: tenantApiData.status === 'DISABLED',
                  userId: -1, // Hoặc một giá trị mặc định cho userId khi nó không hợp lệ
                  status: tenantApiData.status,
                } as Tenant);
              }

              // Trường hợp userId hợp lệ
              return this.tenantService.getUserDetail(currentUserId).pipe(
                map((userDetailsFromApi: any) => {
                  return {
                    id: tenantApiData.id,
                    name: tenantApiData.fullName, // Map từ API
                    email: userDetailsFromApi?.email || 'N/A',
                    phone: userDetailsFromApi?.phoneNumber || 'N/A', // API user trả về phoneNumber
                    businessName: tenantApiData.companyName, // Map từ API
                    isBlocked:
                      tenantApiData.status === 'DISABLED' ||
                      tenantApiData.status === 'REJECTED',
                    userId: currentUserId,
                    status: tenantApiData.status,
                  } as Tenant;
                }),
                catchError(() =>
                  of({
                    id: tenantApiData.id,
                    name: tenantApiData.fullName,
                    email: 'N/A (Error)',
                    phone: 'N/A (Error)',
                    businessName: tenantApiData.companyName,
                    isBlocked:
                      tenantApiData.status === 'DISABLED' ||
                      tenantApiData.status === 'REJECTED',
                    userId: currentUserId,
                    status: tenantApiData.status,
                  } as Tenant)
                )
              );
            });

          return forkJoin(tenantDetailObservables);
        }), // Kết thúc mergemap

        // Thêm trường hợp lỗi
        catchError((error) => {
          this.isLoading = false;
          this.tenants = [];
          return of([]);
        }) // <- Đã thêm dấu đóng ngoặc ở đây
      )
      .subscribe((tenantList: Tenant[]) => {
        this.tenants = tenantList;
        this.isLoading = false;
      }); // <- Đã thêm xử lý kết quả
  }

  // Các hàm thêm để không bị lỗi khi test HTML
  get filteredTenants(): Tenant[] {
    if (!this.searchTerm.trim()) return this.tenants;
    const search = this.searchTerm.toLowerCase();
    return this.tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.email?.toLowerCase().includes(search) ||
        t.phone?.toLowerCase().includes(search) ||
        t.businessName.toLowerCase().includes(search)
    );
  }

  openConfirm(tenant: Tenant, action: 'block' | 'unblock' | 'delete'): void {
    this.selectedTenant = tenant;
    this.actionType = action;
    this.showConfirmModal = true;
  }

  closeConfirm(): void {
    this.showConfirmModal = false;
  }

  confirmAction(): void {
    if (!this.selectedTenant) {
      // Nếu không có Tenant nào thì đóng modal
      this.closeConfirm();
      return;
    }

    let newApiStatusValue: string = this.selectedTenant.status || '';
    let newFrontendIsBlockedValue: boolean = this.selectedTenant.isBlocked;

    if (this.actionType === 'block') {
      //Người dùng muốn disable Tenant
      newApiStatusValue = 'DISABLED';
      newFrontendIsBlockedValue = true;
    } else if (this.actionType === 'unblock') {
      //SA muốn active Tenant
      newApiStatusValue = 'APPROVED';
      newFrontendIsBlockedValue = false;
    } // Còn trạng thái delete thì qua component detail mới làm

    //Tạo đối tượng DTO để gửi lên back end
    const tenantDto: TenantDTO = {
      id: this.selectedTenant.id,
      companyName: this.selectedTenant.businessName,
      fullName: this.selectedTenant.name,
      taxId: this.selectedTenant.taxId,
      status: newApiStatusValue,
      userId: this.selectedTenant.userId,
    };

    // Gọi service để cập nhật Tenant
    this.tenantService
      .updateTenantStatus(this.selectedTenant.id, tenantDto)
      .subscribe({
        next: (response) => {
          // Xử lý khi cập nhật thành công
          if (this.selectedTenant) {
            this.selectedTenant.isBlocked = newFrontendIsBlockedValue;

            // Xác định tenant cập nhật thành công để cập nhật lại giao diện
            const index = this.tenants.findIndex(
              (t) => t.id === this.selectedTenant!.id
            );
            if (index !== -1) {
              this.tenants[index] = { ...this.selectedTenant };
            }
          }
          this.resultMessage = `The status of tenant "${tenantDto.fullName}" has been updated successfully.`;
          this.showResultModal = true;
        },
        error: (err) => {
          // Xử lý khi có lỗi xảy ra
          console.error('Error updating tenant status:', err);
          let errorMessage = `Không thể cập nhật trạng thái cho tenant "${tenantDto.fullName}".`;
          if (err.error && err.error.message) {
            errorMessage += ` Lỗi từ server: ${err.error.message}`;
          } else if (err.message) {
            errorMessage += ` Lỗi: ${err.message}`;
          }
          this.resultMessage = errorMessage;
          this.showResultModal = true;
        },
        complete: () => {
          this.closeConfirm();
        },
      });
  }

  closeResult(): void {
    this.showResultModal = false;
  }

  // 3. TẠO HÀM viewDetails để chuyển hướng tới xem chi tiết tenant
  viewDetails(id: number): void {
    // SỬA ĐỔI DÒNG NÀY để khớp với path trong app.routes.ts
    this.router.navigate(['/tenant-account-details', id]);
    console.log('Navigating to details for tenant ID:', id);
  }
}
