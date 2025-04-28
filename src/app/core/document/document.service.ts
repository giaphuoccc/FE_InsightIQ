import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Định nghĩa hoặc import interface BackendDocument
export interface BackendDocument {
  id: number;
  fileName: string;
  fileUrl: string;
  tenantId: number;
  createdAt: string;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  // --- SỬA URL CHO KHỚP VỚI BACKEND MOUNT POINT VÀ ROUTE ---
  private baseApiUrl = '/documents'; // Base path a backend đang dùng
  private uploadApiUrl = `${this.baseApiUrl}/upload`; // URL đầy đủ: /documents/upload

  constructor(private http: HttpClient) { }

  /**
   * Tải một file lên backend.
   */
  uploadDocument(file: File, tenantId: number): Observable<BackendDocument> {
    const formData: FormData = new FormData();
    // Tên field 'file' và 'tenantId' phải khớp với backend
    formData.append('file', file, file.name);
    formData.append('tenantId', tenantId.toString());

    console.log('[Angular DocumentService] Sending upload request (expecting body) to:', this.uploadApiUrl); // Log URL đúng
    console.log('[Angular DocumentService] FormData contains file:', formData.has('file'));
    console.log('[Angular DocumentService] FormData contains tenantId:', formData.has('tenantId'));

    // Dùng http.post với URL đã sửa
    return this.http.post<BackendDocument>(this.uploadApiUrl, formData, {
        // headers: new HttpHeaders({ ... }) // Thêm headers nếu cần
    });
  }

  // --- Các hàm khác (sử dụng baseApiUrl) ---
  getDocuments(): Observable<BackendDocument[]> {
     // URL: /documents
     return this.http.get<BackendDocument[]>(this.baseApiUrl);
  }

  deleteDocument(id: number): Observable<any> {
     // URL: /documents/:id
     const deleteUrl = `${this.baseApiUrl}/${id}`;
     return this.http.delete(deleteUrl);
  }
}
