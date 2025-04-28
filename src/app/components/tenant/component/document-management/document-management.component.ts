import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';

// Đảm bảo đường dẫn này ĐÚNG
//import { DocumentService } from '../../services/document.service';
import { DocumentService } from '../../../../core/document/document.service'; // Assuming this path is correct
import { finalize } from 'rxjs/operators';

// Định nghĩa interface cho đối tượng document để hiển thị
interface DisplayDocument {
  id?: number;
  name: string;
  modified: string;
  size: string;
  fileUrl?: string;
}

// Định nghĩa interface cho dữ liệu trả về từ backend
interface BackendDocument {
    id: number;
    fileName: string;
    createdAt: string; // ISO String format expected from backend
    fileUrl: string;
    size?: number;
    tenantId?: number;
}


@Component({
  standalone: true,
  selector: 'app-manage-document',
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [DocumentService] // Cần cung cấp service
})
export class DocumentManagementComponent implements OnInit {

  // Dữ liệu mẫu ban đầu
  documents: DisplayDocument[] = [
    { id: undefined, name: 'List_of_sale_products.pdf', modified: '20/11/2024 7:52PM', size: '41MB', fileUrl: undefined },
    { id: undefined, name: 'Summer_new_product_list.pdf', modified: '1/5/2024 1:02PM', size: '25MB', fileUrl: undefined },
    { id: undefined, name: '20%_off_product_list.pdf', modified: '20/3/2024 10:11AM', size: '18MB', fileUrl: undefined },
  ];

  fileToUpload: File | null = null;
  tenantId: number | null = null;
  isUploading = false;
  uploadMessage: string | null = null;
  uploadError: boolean = false;

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    // this.loadDocuments();
    console.log('DocumentManagementComponent initialized');
  }

  // Hàm helper để chuyển đổi dữ liệu backend sang định dạng hiển thị
  private mapBackendToDisplay(doc: BackendDocument): DisplayDocument {
      if (!doc) {
          console.warn("mapBackendToDisplay called with null or undefined document");
          return { id: undefined, name: 'Lỗi dữ liệu', modified: 'N/A', size: 'N/A', fileUrl: undefined };
      }
      return {
          id: doc.id,
          name: doc.fileName,
          // Sử dụng toLocaleString để hiển thị ngày giờ theo định dạng địa phương
          modified: doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'N/A',
          // Ưu tiên size từ backend, nếu không có thì dùng size từ file gốc (nếu còn)
          size: doc.size ? this.formatBytes(doc.size) : (this.fileToUpload ? this.formatBytes(this.fileToUpload.size) : 'N/A'),
          fileUrl: doc.fileUrl
      };
  }


  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileToUpload = input.files[0];
      const tempSize = this.formatBytes(this.fileToUpload.size);
      this.uploadMessage = `Đã chọn file: ${this.fileToUpload.name} (${tempSize})`;
      this.uploadError = false;
      console.log(`File selected: ${this.fileToUpload.name}, Size: ${this.fileToUpload.size}`);
    } else {
      this.fileToUpload = null;
      this.uploadMessage = null;
    }
    input.value = '';
  }

  onUpload(): void {
    console.log('--- onUpload started ---');

    // --- Kiểm tra đầu vào ---
    if (!this.fileToUpload) {
      this.uploadMessage = 'Vui lòng chọn một file để tải lên.';
      this.uploadError = true;
      console.log('Error: No file selected.');
      return;
    }
    if (this.tenantId === null || this.tenantId === undefined) {
      this.uploadMessage = 'Vui lòng nhập Tenant ID.';
      this.uploadError = true;
      console.log('Error: Tenant ID missing.');
      return;
    }
     if (isNaN(this.tenantId) || this.tenantId <= 0) {
       this.uploadMessage = 'Tenant ID không hợp lệ.';
       this.uploadError = true;
       console.log('Error: Invalid Tenant ID.');
       return;
     }
    if (this.isUploading) {
       console.log('Upload already in progress.');
       return;
    }
    // --- Kết thúc kiểm tra đầu vào ---

    console.log('--- Input checks passed ---');

    // --- Bắt đầu quá trình Upload ---
    this.isUploading = true;
    this.uploadMessage = 'Đang tải lên...';
    this.uploadError = false;
    const fileToUploadNow = this.fileToUpload; // Lưu lại file để tránh thay đổi bất ngờ
    const tenantIdNow = this.tenantId; // Lưu lại tenantId

    console.log(`Attempting to upload: ${fileToUploadNow.name}, Tenant: ${tenantIdNow}`);
    console.log('Calling documentService.uploadDocument...');

    // --- Gỡ comment phần pipe và subscribe ---
    this.documentService.uploadDocument(fileToUploadNow, tenantIdNow)
      .pipe(
          finalize(() => {
              // Khối này sẽ chạy sau khi subscribe hoàn thành (next hoặc error)
              this.isUploading = false;
              console.log('Upload finalize called.');
          })
      )
      .subscribe({
        // Xử lý khi nhận được phản hồi thành công từ service
        next: (newDocument: BackendDocument) => { // Đảm bảo service trả về đúng kiểu BackendDocument
          console.log('--- Subscribe next handler ---');
          console.log('Received response body:', newDocument);

          // Kiểm tra lại kiểu dữ liệu nhận được (đề phòng trường hợp service trả về không đúng)
          if (!newDocument || typeof newDocument !== 'object' || !newDocument.id || !newDocument.fileName) {
              console.error('Received invalid response body structure:', newDocument);
              this.uploadMessage = 'Lỗi: Phản hồi từ server không đúng định dạng.';
              this.uploadError = true;
              return;
          }

          // Xử lý thành công
          this.uploadMessage = `Tải lên thành công: ${newDocument.fileName}`;
          this.uploadError = false;

          // Cập nhật danh sách documents trên UI
          const displayDoc = this.mapBackendToDisplay(newDocument);
          this.documents.push(displayDoc); // Thêm vào cuối danh sách

          // Reset trạng thái upload
          this.fileToUpload = null; // Xóa file đã chọn khỏi trạng thái
          // this.tenantId = null; // Reset tenantId nếu muốn

          console.log('UI updated with new document.');
        },
        // Xử lý khi có lỗi xảy ra trong quá trình gọi service hoặc từ backend
        error: (err: any | HttpErrorResponse) => {
          console.log('--- Subscribe error handler ---');
          console.error('Upload failed in subscribe:', err); // Log lỗi đầy đủ

          // Xử lý lỗi
          this.uploadError = true;
          // Cố gắng hiển thị lỗi cụ thể hơn cho người dùng
          if (err instanceof HttpErrorResponse) {
            let detail = err.error?.message || err.error?.error_description || err.error?.error || err.message || '';
             if (err.error && err.error.details) {
                detail += ` (${err.error.details})`;
             }
             if (err.status === 0) {
                 this.uploadMessage = 'Lỗi mạng: Không thể kết nối đến máy chủ.';
             } else {
                 this.uploadMessage = `Lỗi ${err.status}: ${err.statusText}. ${detail}`;
             }
            console.error(`HTTP Error ${err.status}:`, err.error);
          } else if (err instanceof Error) {
            this.uploadMessage = `Lỗi: ${err.message}`;
          } else {
            // Trường hợp lỗi không xác định khác
            this.uploadMessage = 'Đã xảy ra lỗi không xác định khi tải lên.';
            console.error('Unknown error object:', err);
          }
        }
      });

      console.log('--- subscribe called, waiting for response ---');
      // --- Kết thúc quá trình Upload ---
  }

  onDelete(index: number): void {
    const docToDelete = this.documents[index];
    if (!docToDelete) return;

    if (confirm(`Bạn có chắc muốn xóa file "${docToDelete.name}" không?`)) {
      if (docToDelete.id === undefined) {
        console.warn('Deleting document without ID (likely sample data). Removing from list only.');
        this.documents.splice(index, 1);
        return;
      }

      console.log(`Attempting to delete document with ID: ${docToDelete.id}`);
      // TODO: Gọi service deleteDocument(docToDelete.id).subscribe(...)
      // Xóa khỏi UI sau khi backend xác nhận thành công trong subscribe 'next'
      // this.documentService.deleteDocument(docToDelete.id).subscribe({ ... });

       // Tạm thời chỉ xóa ở frontend
       this.documents.splice(index, 1);
       alert(`Đã xóa "${docToDelete.name}" (tạm thời ở frontend).`);
    }
  }

  // Hàm tiện ích để định dạng kích thước file
  private formatBytes(bytes: number, decimals = 2): string {
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const sizeIndex = Math.min(i, sizes.length - 1);
      if (sizeIndex < 0) return '0 Bytes';
      return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm)) + ' ' + sizes[sizeIndex];
  }
}
