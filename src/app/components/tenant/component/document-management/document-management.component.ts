// src/app/features/document-management/document-management.component.ts

import { Input } from '@angular/core';
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import {
  DocumentService,
  BackendDocument,
  TenantInfo,
} from '../../../../service/document/document.service';
import { finalize } from 'rxjs/operators';

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
})
export class DocumentManagementComponent implements OnInit {
  tenantId: string | number | null = null;

  documents: DisplayDocument[] = [];
  fileToUpload: File | null = null;
  // tenantId: number | null = null;
  isUploading = false;
  uploadMessage: string | null = null;
  uploadError: boolean = false;
  isLoadingDocuments = false;
  deleteMessage: string | null = null;
  deleteError: boolean = false;
  validFrom: string | null = null; // Store as YYYY-MM-DD string
  validUntil: string | null = null; // Store as YYYY-MM-DD string

  // --- NEW: Properties for validity dates ---
  validFromDate: string | null = null; // Bound to date input (YYYY-MM-DD)
  validUntilDate: string | null = null; // Bound to date input (YYYY-MM-DD)
  // --- End NEW ---

  constructor(
    private documentService: DocumentService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    console.log(
      'DocumentManagementComponent initialized. Attempting to fetch tenant info...'
    );

    if (isPlatformBrowser(this.platformId)) {
      this.documentService.getCurrentTenantInfo().subscribe({
        next: (tenantInfo: TenantInfo) => {
          if (tenantInfo?.tenantId != null) {
            this.tenantId = tenantInfo.tenantId;
            console.log('Fetched tenantId:', this.tenantId);
            this.loadDocuments();
          } else {
            console.warn('Không lấy được tenantId từ tenantInfo:', tenantInfo);
            this.uploadMessage = 'Không thể xác định thông tin Tenant.';
            this.uploadError = true;
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Lỗi khi lấy tenant info:', error);
          this.uploadMessage = 'Không thể lấy thông tin đăng nhập.';
          this.uploadError = true;
        },
      });
    } else {
      console.log('Skipping loadDocuments on server during SSR.');
      this.documents = [];
      this.isLoadingDocuments = false;
    }
  }

  private mapBackendToDisplay(doc: BackendDocument): DisplayDocument {
    if (!doc) {
      console.warn(
        'mapBackendToDisplay called with null or undefined document'
      );
      return {
        id: undefined,
        name: 'Error',
        modified: 'N/A',
        size: 'N/A',
        fileUrl: undefined,
      };
    }
    return {
      id: doc.id,
      name: doc.fileName,
      modified: doc.createdAt
        ? new Date(doc.createdAt).toLocaleString()
        : 'N/A',
      size: doc.size ? this.formatBytes(doc.size) : 'N/A', // Assuming size is provided by backend eventually
      fileUrl: doc.fileUrl,
    };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.fileToUpload = input.files[0];
      const tempSize = this.formatBytes(this.fileToUpload.size);
      // Clear previous upload messages when new file is selected
      this.uploadMessage = `File Selected: ${this.fileToUpload.name} (${tempSize})`;
      this.uploadError = false;
      this.deleteMessage = null; // Also clear delete message
      console.log(
        `File selected: ${this.fileToUpload.name}, Size: ${this.fileToUpload.size}`
      );
    } else {
      this.fileToUpload = null;
      // Keep upload message if needed, or clear it:
      // this.uploadMessage = null;
    }
    if (input) {
      input.value = ''; // Reset input
    }
  }

  // --- Updated onUpload method ---
  onUpload(): void {
    console.log('--- onUpload started ---');

    // --- Combine Validation Checks ---
    if (!this.fileToUpload) {
      this.uploadMessage = 'Please select a file to upload.';
      this.uploadError = true;
      console.log('Error: No file selected.');
      return;
    }
    // if (
    //   this.tenantId === null ||
    //   this.tenantId === undefined ||
    //   isNaN(this.tenantId) ||
    //   this.tenantId <= 0
    // ) {
    //   this.uploadMessage = 'Tenant ID không hợp lệ.';
    //   this.uploadError = true;
    //   console.log('Error: Invalid Tenant ID.');
    //   return;
    // }
    // --- Add Date Validation ---
    if (!this.validFrom) {
      this.uploadMessage = 'Please select a valid start date (Valid From).';
      this.uploadError = true;
      console.log('Error: Valid From date missing.');
      return;
    }
    if (!this.validUntil) {
      this.uploadMessage = 'Please select a valid end date (Valid Until).';
      this.uploadError = true;
      console.log('Error: Valid Until date missing.');
      return;
    }
    // Optional: Check if validUntil is after validFrom
    if (this.validFrom > this.validUntil) {
      this.uploadMessage =
        'Error: Valid Until date must be after Valid From date.';
      this.uploadError = true;
      console.log('Error: Valid Until date is before Valid From date.');
      return;
    }

    if (this.isUploading) {
      console.log('Upload already in progress.');
      return;
    }
    console.log('--- Input checks passed ---');

    this.isUploading = true;
    this.uploadMessage = 'Uploading...';
    this.uploadError = false;
    this.deleteMessage = null;

    // Store current values to avoid issues if user changes them during async operation
    const fileToUploadNow = this.fileToUpload;
    // const tenantIdNow = this.tenantId;
    const validFromNow = this.validFrom;
    const validUntilNow = this.validUntil;

    console.log(
      `Attempting upload: ${fileToUploadNow.name} , ValidFrom: ${validFromNow}, ValidUntil: ${validUntilNow}`
    );
    console.log('Calling documentService.uploadDocument...');

    // --- Call service with date info ---
    this.documentService
      .uploadDocument(fileToUploadNow, validFromNow, validUntilNow)
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

          // Basic validation of the response
          if (!newDocument?.id || !newDocument?.fileName) {
            console.error(
              'Received invalid response body structure:',
              newDocument
            );
            this.uploadMessage =
              'Error: Invalid response structure from backend.';
            this.uploadError = true;
            return;
          }

          this.uploadMessage = `Tải lên thành công: ${newDocument.fileName}`;
          this.uploadError = false;

          // Add to display list
          const displayDoc = this.mapBackendToDisplay(newDocument);
          this.documents.unshift(displayDoc); // Add to the top

          // --- Reset form fields ---
          this.fileToUpload = null;
          this.validFrom = null; // Reset date
          this.validUntil = null; // Reset date
          // Optionally reset tenantId: this.tenantId = null;

          console.log('UI updated with new document. Form fields reset.');
        },
        error: (err: any | HttpErrorResponse) => {
          console.log('--- Subscribe error handler (Upload) ---');
          console.error('Upload failed in subscribe:', err);

          this.uploadError = true;
          if (err instanceof HttpErrorResponse) {
            let detail =
              err.error?.message ||
              err.error?.error ||
              err.message ||
              JSON.stringify(err.error);
            if (err.status === 0) {
              this.uploadMessage = 'Error: Cannot connect to server.';
            } else {
              this.uploadMessage = `Error ${err.status}: ${detail}`;
            }
          } else {
            this.uploadMessage = `Unknown Error: ${err?.message || err}`;
          }
        },
      });
    console.log('--- subscribe called (Upload), waiting for response ---');
  }
  // onDelete method remains the same
  onDelete(index: number): void {
    // ... (existing delete logic) ...
    this.deleteMessage = null;
    this.deleteError = false;
    const docToDelete = this.documents[index];
    if (!docToDelete || docToDelete.id === undefined) {
      console.warn(
        'Attempting to delete document without ID or not found at index:',
        index
      );
      if (
        docToDelete &&
        confirm(
          `"${docToDelete.name}" does not exist on the server. Do you want to remove it from the list?`
        )
      ) {
        this.documents.splice(index, 1);
      }
      return;
    }
    if (confirm(`Do you want to delete "${docToDelete.name}" ?`)) {
      console.log(`Attempting to delete document with ID: ${docToDelete.id}`);
      this.documentService.deleteDocument(docToDelete.id).subscribe({
        next: () => {
          console.log(
            `Successfully deleted document with ID: ${docToDelete.id} from backend.`
          );
          this.deleteMessage = `Deleted succesfully "${docToDelete.name}".`;
          this.deleteError = false;
          this.documents.splice(index, 1); // Remove from UI
        },
        error: (err: any | HttpErrorResponse) => {
          console.error(
            `Error deleting document with ID: ${docToDelete.id}`,
            err
          );
          this.deleteError = true;
          if (err instanceof HttpErrorResponse) {
            /* ... */
          } else {
            /* ... */
          }
        },
      });
    }
  }

  // Hàm load document
  loadDocuments(): void {
    // Bước 1.1: Thêm kiểm tra tenantId ngay đầu hàm
    if (!this.tenantId) {
      console.error(
        'loadDocuments called, but tenantId is missing or invalid.'
      );
      this.isLoadingDocuments = false;
      this.documents = [];
      this.uploadMessage = 'Lỗi: Không thể xác định Tenant để tải tài liệu.';
      this.uploadError = true;
      return; // Dừng thực thi hàm nếu không có tenantId
    }

    console.log(`Loading documents for tenant ID: ${this.tenantId}...`);
    this.isLoadingDocuments = true;
    this.uploadMessage = null;
    this.uploadError = false;

    // Bước 1.2: Sửa dòng này để truyền this.tenantId
    this.documentService
      .getDocumentsByTenantId(this.tenantId) // <<<< THAY ĐỔI CHÍNH Ở ĐÂY
      .pipe(
        finalize(() => {
          this.isLoadingDocuments = false;
          console.log(
            'Finished loading documents attempt for DocumentManagementComponent.'
          );
        })
      )
      .subscribe({
        next: (backendDocs: BackendDocument[]) => {
          console.log(
            `Received ${backendDocs.length} documents for tenant ${this.tenantId} in DocumentManagementComponent:`,
            backendDocs
          );
          this.documents = backendDocs.map((doc) =>
            this.mapBackendToDisplay(doc)
          );
          if (backendDocs.length === 0) {
            this.uploadMessage = 'Không tìm thấy tài liệu nào cho Tenant này.';
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error(
            `Error loading documents for tenant ${this.tenantId} in DocumentManagementComponent:`,
            err
          );
          this.uploadMessage = `Lỗi tải danh sách tài liệu: ${
            err.statusText || err.message
          }`;
          this.uploadError = true;
          this.documents = [];
        },
      });
  }

  // formatBytes method remains the same
  private formatBytes(bytes: number, decimals = 2): string {
    // ... (existing formatBytes logic) ...
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
