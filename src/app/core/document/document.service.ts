// src/app/core/document/document.service.ts (Modified)

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
  size?: number; // Thêm size nếu backend trả về
}

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private baseApiUrl = '/documents';

  constructor(private http: HttpClient) {}

  /**
   * Tải một file lên backend cùng với thông tin ngày hiệu lực.
   */
  // --- Method signature updated ---
  uploadDocument(
    file: File,
    validFrom: string,
    validUntil: string
  ): Observable<BackendDocument> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);
    formData.append('validFrom', validFrom);
    formData.append('validUntil', validUntil);
    // REMOVED: formData.append('tenantId', tenantId.toString());

    const uploadApiUrl = `${this.baseApiUrl}/upload`;
    console.log(
      `[Angular DocumentService] Sending upload request to: ${uploadApiUrl}`
    );
    // Log removed tenantId info
    console.log('[Angular DocumentService] FormData details:', {
      hasFile: formData.has('file'),
      // REMOVED: hasTenantId
      hasValidFrom: formData.has('validFrom'),
      validFromValue: formData.get('validFrom'),
      hasValidUntil: formData.has('validUntil'),
      validUntilValue: formData.get('validUntil'),
    });

    return this.http.post<BackendDocument>(uploadApiUrl, formData);
  }

  /**
   * Lấy danh sách tất cả documents.
   */
  getDocuments(): Observable<BackendDocument[]> {
    return this.http.get<BackendDocument[]>(this.baseApiUrl);
  }

  /**
   * Xóa một document dựa vào ID.
   */
  deleteDocument(id: number): Observable<any> {
    const deleteUrl = `${this.baseApiUrl}/${id}`;
    console.log(
      `[Angular DocumentService] Sending DELETE request to: ${deleteUrl}`
    );
    return this.http.delete(deleteUrl);
  }
}
