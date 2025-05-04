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
  private baseApiUrl = '/documents'; // Adjust if your API prefix is different

  constructor(private http: HttpClient) {}

  /**
   * Tải một file lên backend cùng với thông tin ngày hiệu lực.
   */
  // --- Method signature updated ---
  uploadDocument(
    file: File,
    tenantId: number,
    validFrom: string,
    validUntil: string
  ): Observable<BackendDocument> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name); // Field name 'file'
    formData.append('tenantId', tenantId.toString()); // Field name 'tenantId'
    // --- Append date strings ---
    formData.append('validFrom', validFrom); // Field name 'validFrom'
    formData.append('validUntil', validUntil); // Field name 'validUntil'

    const uploadApiUrl = `${this.baseApiUrl}/upload`;

    console.log(
      `[Angular DocumentService] Sending upload request to: ${uploadApiUrl}`
    );
    console.log('[Angular DocumentService] FormData details:', {
      hasFile: formData.has('file'),
      hasTenantId: formData.has('tenantId'),
      hasValidFrom: formData.has('validFrom'),
      validFromValue: formData.get('validFrom'), // Log value
      hasValidUntil: formData.has('validUntil'),
      validUntilValue: formData.get('validUntil'), // Log value
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
