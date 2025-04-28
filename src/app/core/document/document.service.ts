// src/app/core/document/document.service.ts (hoặc đường dẫn tương ứng)

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Định nghĩa hoặc import interface BackendDocument
export interface BackendDocument {
  id: number;
  fileName: string;
  fileUrl: string;
  tenantId: number;
  createdAt: string; // ISO String format expected
  size?: number;     // Thêm size nếu backend trả về
}

@Injectable({
  providedIn: 'root' // Hoặc cung cấp trong component/module nếu cần
})
export class DocumentService {

  // Đảm bảo baseApiUrl trỏ đúng vào mount point của DocumentController trong Express
  private baseApiUrl = '/documents'; // Base path mà backend đang dùng cho document routes

  constructor(private http: HttpClient) { }

  /**
   * Tải một file lên backend.
   */
  uploadDocument(file: File, tenantId: number): Observable<BackendDocument> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name); // Field name 'file' khớp với multer
    formData.append('tenantId', tenantId.toString()); // Field name 'tenantId' khớp với backend

    const uploadApiUrl = `${this.baseApiUrl}/upload`; // URL đầy đủ: /documents/upload

    console.log('[Angular DocumentService] Sending upload request to:', uploadApiUrl);
    console.log('[Angular DocumentService] FormData contains file:', formData.has('file'));
    console.log('[Angular DocumentService] FormData contains tenantId:', formData.has('tenantId'));

    // Backend trả về BackendDocument trong body khi thành công (status 201)
    return this.http.post<BackendDocument>(uploadApiUrl, formData);
  }

  /**
   * Lấy danh sách tất cả documents.
   */
  getDocuments(): Observable<BackendDocument[]> {
    // GET /documents
    return this.http.get<BackendDocument[]>(this.baseApiUrl);
  }

  /**
   * Xóa một document dựa vào ID.
   * @param id ID của document cần xóa.
   * @returns Observable<any> - Thường không có body trả về khi xóa thành công (204 No Content).
   */
  deleteDocument(id: number): Observable<any> { // <-- THÊM HÀM NÀY
    const deleteUrl = `${this.baseApiUrl}/${id}`; // URL: /documents/:id
    console.log(`[Angular DocumentService] Sending DELETE request to: ${deleteUrl}`);
    // Gửi request DELETE, không cần body.
    // Backend sẽ trả về 204 (No Content) nếu thành công, 404 nếu không tìm thấy, 500 nếu lỗi.
    return this.http.delete(deleteUrl);
  }
}