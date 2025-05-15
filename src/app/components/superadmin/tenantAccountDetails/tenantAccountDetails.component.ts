import {
  Component,
  Input,
  OnInit, // Thêm Input và OnInit nếu cần
} from '@angular/core';
import { CommonModule } from '@angular/common'; // Thêm CommonModule
import { FormsModule } from '@angular/forms'; // Thêm FormsModule
import { ActivatedRoute, ParamMap } from '@angular/router';
import {
  fullTenantDetailData,
  TenantAccountListDetailService,
} from '../../../service/superAdmin/tenantAccountListDetail.service';
import { error } from 'console';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';

// --- Các interface từ TenantManagementDetailComponent ---
export interface PersonalInfo {
  name: string;
  phone: string;
}

export interface BusinessInfo {
  name: string;
}

export interface Document {
  name: string;
  dateModified: string;
  size: string;
}

export interface FinanceRecord {
  feeName: string;
  payable: string;
  paid: string;
  discount: string;
  debt: string;
  paymentDate: string;
}
// --- Kết thúc các interface ---

@Component({
  selector: 'app-tenant-account-details',
  standalone: true, // Thêm standalone: true
  imports: [CommonModule, FormsModule], // Thêm imports: [CommonModule, FormsModule]
  templateUrl: './tenantAccountDetails.component.html',
  styleUrl: './tenantAccountDetails.component.css',
})
export class TenantAccountDetailsComponent implements OnInit {
  // Implement OnInit nếu bạn có logic khởi tạo

  // --- Các thuộc tính và @Input từ TenantManagementDetailComponent ---
  @Input() title: string = 'Tenant Management'; // Giữ lại hoặc thay đổi giá trị mặc định nếu cần
  @Input() subtitle: string = 'Tenant Information'; // Giữ lại hoặc thay đổi giá trị mặc định nếu cần

  tenantId: string | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Dữ liệu mẫu, bạn sẽ thay thế bằng dữ liệu thật từ API hoặc service sau này
  personalInfo: PersonalInfo = {
    // Thêm ví dụ cho PersonalInfo nếu cần
    name: 'Tenant User Name',
    phone: '0123456789',
  };

  businessInfo: BusinessInfo = {
    // Thêm ví dụ cho BusinessInfo nếu cần
    name: 'Tenant Business Name',
  };

  documents: Document[] = [
    {
      name: 'List_of_sale_products.pdf',
      dateModified: '20/11/2024 7:52PM',
      size: '41MB',
    },
    {
      name: 'Summer_new_product_list.pdf',
      dateModified: '1/5/2024 1:02PM',
      size: '25MB',
    },
    {
      name: '20%_off_product_list.pdf',
      dateModified: '20/3/2024 10:11AM',
      size: '18MB',
    },
  ];

  financeRecords: FinanceRecord[] = [
    {
      feeName: 'Unlimited',
      payable: '499$',
      paid: '399$',
      discount: '0',
      debt: '100$',
      paymentDate: '01/15/2025',
    },
    {
      feeName: 'Advanced plan',
      payable: '99$',
      paid: '99$',
      discount: '0',
      debt: '0',
      paymentDate: '12/15/2024',
    },
  ];
  // --- Kết thúc các thuộc tính ---

  constructor(
    private route: ActivatedRoute,
    private tenantDetailService: TenantAccountListDetailService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idFromRoute = params.get('id');
      if (idFromRoute) {
        this.tenantId = idFromRoute;
        if (isPlatformBrowser(this.platformId)) {
          this.loadTenantDetails(this.tenantId);
        } else {
          console.log('Đang chạy trên server - bỏ qua gọi API.');
          this.isLoading = false;
        }
      } else {
        console.error('Không tìm thấy tenantId trong route.');
        this.errorMessage = 'Không tìm thấy ID của Tenant trong đường dẫn.';
        this.isLoading = false;
      }
    });
  }

  private mapServiceDocToDisplayDoc(serviceDoc: any): Document {
    const dateModified = serviceDoc.createdAt
      ? new Date(serviceDoc.createdAt).toLocaleString()
      : 'N/A';
    return {
      name: serviceDoc.fileName,
      dateModified: dateModified,
      size: serviceDoc.size
        ? `${(serviceDoc.size / 1024 / 1024).toFixed(2)} MB`
        : 'N/A',
    };
  }

  // Hàm tải thông tin Tenant
  loadTenantDetails(id: string): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.tenantDetailService
      .getFullTenantDetails(id)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (data: fullTenantDetailData) => {
          this.personalInfo = {
            name: data.fullName,
            phone: data.user?.phoneNumber || 'N/A',
          };
          this.businessInfo = {
            name: data.companyName,
            // website: data.website || 'N/A' // nếu có trường này
          };
          if (Array.isArray(data.documents)) {
            this.documents = data.documents.map((doc) =>
              this.mapServiceDocToDisplayDoc(doc)
            );
          } else {
            this.documents = [];
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Lỗi khi lấy tenant: ', err);
          this.errorMessage = `Không thể tải dữ liệu: ${err.status} - ${err.message}`;
          this.personalInfo = { name: '', phone: '' };
          this.businessInfo = { name: '' };
          this.documents = [];
        },
      });
  }
}
