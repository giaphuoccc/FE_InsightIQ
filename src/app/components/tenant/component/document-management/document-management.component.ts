// src/app/features/document-management/document-management.component.ts (hoặc đường dẫn tương ứng)

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { DocumentService, BackendDocument } from '../../../../core/document/document.service'; // Đảm bảo import đúng
import { finalize } from 'rxjs/operators';

// Interface để hiển thị trên UI
interface DisplayDocument {
  id?: number;
  name: string;
  modified: string;
  size: string;
  fileUrl?: string;
}

@Component({
  standalone: true,
  selector: 'app-manage-document',
  templateUrl: './document-management.component.html',
  styleUrls: ['./document-management.component.css'],
  imports: [CommonModule, FormsModule, HttpClientModule],
  providers: [DocumentService] // Cung cấp service ở đây nếu component standalone
})
export class DocumentManagementComponent implements OnInit {

  documents: DisplayDocument[] = []; // Khởi tạo mảng rỗng, sẽ load từ service
  fileToUpload: File | null = null;
  tenantId: number | null = null;
  isUploading = false;
  uploadMessage: string | null = null;
  uploadError: boolean = false;
  isLoadingDocuments = false; // Thêm cờ để biết đang load danh sách
  deleteMessage: string | null = null; // Thêm message cho việc xóa
  deleteError: boolean = false;

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.loadDocuments(); // Gọi hàm load documents khi component khởi tạo
    console.log('DocumentManagementComponent initialized');
  }

  // --- Hàm load documents từ backend ---
  loadDocuments(): void {
    console.log('Loading documents...');
    this.isLoadingDocuments = true;
    this.documentService.getDocuments()
      .pipe(finalize(() => this.isLoadingDocuments = false))
      .subscribe({
        next: (backendDocs: BackendDocument[]) => {
          console.log('Received documents from backend:', backendDocs);
          // Map dữ liệu backend sang định dạng hiển thị
          this.documents = backendDocs.map(doc => this.mapBackendToDisplay(doc));
          console.log('Mapped documents for display:', this.documents);
          if (this.documents.length === 0) {
            console.log('No documents found.');
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error loading documents:', err);
          // Hiển thị lỗi cho người dùng (ví dụ)
          this.uploadMessage = `Lỗi tải danh sách tài liệu: ${err.statusText}`;
          this.uploadError = true;
          this.documents = []; // Xóa danh sách cũ nếu có lỗi
        }
      });
  }

  // Hàm helper để chuyển đổi dữ liệu backend sang định dạng hiển thị (giữ nguyên)
  private mapBackendToDisplay(doc: BackendDocument): DisplayDocument {
      // ... (code mapBackendToDisplay giữ nguyên)
      if (!doc) {
        console.warn("mapBackendToDisplay called with null or undefined document");
        return { id: undefined, name: 'Lỗi dữ liệu', modified: 'N/A', size: 'N/A', fileUrl: undefined };
      }
      return {
          id: doc.id,
          name: doc.fileName,
          modified: doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'N/A',
          // Backend nên trả về size nếu có thể, nếu không thì để N/A
          size: doc.size ? this.formatBytes(doc.size) : 'N/A',
          fileUrl: doc.fileUrl
      };
  }

  // Hàm onFileSelected (giữ nguyên)
  onFileSelected(event: Event): void {
      // ... (code onFileSelected giữ nguyên)
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
    // Reset input để có thể chọn lại cùng file
    if (input) {
        input.value = '';
    }
  }

  // Hàm onUpload (giữ nguyên, chỉ cần sửa lại push document)
  onUpload(): void {
      // ... (code kiểm tra đầu vào giữ nguyên)
      console.log('--- onUpload started ---');

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
      console.log('--- Input checks passed ---');

      this.isUploading = true;
      this.uploadMessage = 'Đang tải lên...';
      this.uploadError = false;
      this.deleteMessage = null; // Xóa thông báo xóa cũ nếu có
      const fileToUploadNow = this.fileToUpload;
      const tenantIdNow = this.tenantId;

      console.log(`Attempting to upload: ${fileToUploadNow.name}, Tenant: ${tenantIdNow}`);
      console.log('Calling documentService.uploadDocument...');

      this.documentService.uploadDocument(fileToUploadNow, tenantIdNow)
        .pipe(
            finalize(() => {
                this.isUploading = false;
                console.log('Upload finalize called.');
            })
        )
        .subscribe({
            next: (newDocument: BackendDocument) => {
                console.log('--- Subscribe next handler (Upload) ---');
                console.log('Received response body:', newDocument);

                if (!newDocument || typeof newDocument !== 'object' || !newDocument.id || !newDocument.fileName) {
                   console.error('Received invalid response body structure:', newDocument);
                   this.uploadMessage = 'Lỗi: Phản hồi từ server không đúng định dạng.';
                   this.uploadError = true;
                   return;
                }

                this.uploadMessage = `Tải lên thành công: ${newDocument.fileName}`;
                this.uploadError = false;

                // Map và thêm vào đầu danh sách (hoặc cuối tùy ý)
                const displayDoc = this.mapBackendToDisplay(newDocument);
                this.documents.unshift(displayDoc); // Thêm vào đầu danh sách

                this.fileToUpload = null;
                // this.tenantId = null; // Reset tenantId nếu muốn
                console.log('UI updated with new document.');
            },
            error: (err: any | HttpErrorResponse) => {
                console.log('--- Subscribe error handler (Upload) ---');
                console.error('Upload failed in subscribe:', err);

                this.uploadError = true;
                if (err instanceof HttpErrorResponse) {
                    let detail = err.error?.message || err.error?.error_description || err.error?.error || err.message || JSON.stringify(err.error) || '';
                    if (err.status === 0) {
                        this.uploadMessage = 'Lỗi mạng: Không thể kết nối đến máy chủ.';
                    } else {
                        this.uploadMessage = `Lỗi ${err.status}: ${err.statusText}. ${detail}`;
                    }
                    console.error(`HTTP Error ${err.status}:`, err.error);
                } else if (err instanceof Error) {
                    this.uploadMessage = `Lỗi: ${err.message}`;
                } else {
                    this.uploadMessage = 'Đã xảy ra lỗi không xác định khi tải lên.';
                    console.error('Unknown error object:', err);
                }
            }
        });
      console.log('--- subscribe called (Upload), waiting for response ---');
  }

  // --- Hàm onDelete (Cập nhật để gọi service) ---
  onDelete(index: number): void {
    this.deleteMessage = null; // Reset message trước khi xóa
    this.deleteError = false;

    const docToDelete = this.documents[index];
    if (!docToDelete) {
        console.error('Document not found at index:', index);
        return; // Không tìm thấy doc trong mảng hiện tại
    }

    // Quan trọng: Chỉ gọi service nếu document có ID (không phải dữ liệu mẫu)
    if (docToDelete.id === undefined || docToDelete.id === null) {
        console.warn('Attempting to delete document without ID (likely sample data). Removing from list only.');
        if (confirm(`Dữ liệu mẫu "${docToDelete.name}" này chỉ tồn tại ở phía trình duyệt. Bạn có muốn xóa khỏi danh sách không?`)) {
             this.documents.splice(index, 1);
             this.deleteMessage = `Đã xóa "${docToDelete.name}" khỏi danh sách tạm thời.`;
        }
        return;
    }

    // Xác nhận trước khi xóa
    if (confirm(`Bạn có chắc muốn xóa vĩnh viễn file "${docToDelete.name}" không? Hành động này không thể hoàn tác.`)) {
        console.log(`Attempting to delete document with ID: ${docToDelete.id}`);
        // Hiển thị trạng thái đang xóa (tùy chọn)
        // this.documents[index].name += ' (Đang xóa...)'; // Ví dụ

        this.documentService.deleteDocument(docToDelete.id)
          .subscribe({
            next: () => { // Backend trả về 204 No Content, nên không có body ở đây
                console.log(`Successfully deleted document with ID: ${docToDelete.id} from backend.`);
                this.deleteMessage = `Đã xóa thành công file "${docToDelete.name}".`;
                this.deleteError = false;
                // Xóa khỏi mảng documents trên UI
                this.documents.splice(index, 1);
            },
            error: (err: any | HttpErrorResponse) => {
                console.error(`Error deleting document with ID: ${docToDelete.id}`, err);
                this.deleteError = true;
                 // Cập nhật lại tên nếu đã thay đổi trạng thái (tùy chọn)
                // this.documents[index].name = docToDelete.name; // Bỏ '(Đang xóa...)'

                // Hiển thị lỗi cụ thể hơn
                if (err instanceof HttpErrorResponse) {
                    if (err.status === 404) {
                        this.deleteMessage = `Lỗi: Không tìm thấy tài liệu "${docToDelete.name}" trên server (có thể đã bị xóa?).`;
                        // Cân nhắc xóa khỏi danh sách UI luôn nếu server báo 404
                        this.documents.splice(index, 1);
                    } else {
                        let detail = err.error?.message || err.statusText || JSON.stringify(err.error);
                        this.deleteMessage = `Lỗi khi xóa "${docToDelete.name}" (Mã ${err.status}): ${detail}`;
                    }
                } else {
                     this.deleteMessage = `Lỗi không xác định khi xóa "${docToDelete.name}".`;
                }
            }
          });
    } else {
        console.log('User cancelled deletion.');
    }
  }

  // Hàm formatBytes (giữ nguyên)
  private formatBytes(bytes: number, decimals = 2): string {
      // ... (code formatBytes giữ nguyên)
      if (!bytes || bytes === 0) return '0 Bytes';
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const sizeIndex = Math.min(i, sizes.length - 1);
      if (sizeIndex < 0) return '0 Bytes'; // Should not happen if bytes > 0
      return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(dm)) + ' ' + sizes[sizeIndex];
  }
}