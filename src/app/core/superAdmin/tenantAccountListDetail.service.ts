import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Định nghĩa dữ liệu người dùng liên quan tới tenant
export interface UserData{
  id: number;
  email: string;
  phoneNumber: string;
}

// Định nghĩa dữ liệu tài liệu của Tenant
export interface TenantDocumentData{
  id: number;
  fileName: string;
  fileUrl: string;
  createAt: string;
  size?: number;
}

// Định nghĩa đầy đủ dữ liệu chi tiết của Tenant
export interface fullTenantDetailData{
  id: number;
  companyName: string;
  fullName: string;
  taxId: string;
  status: string;
  userId: number;
  user: UserData;
  documents: TenantDocumentData[];
}

@Injectable({
  providedIn: 'root'
})
export class TenantAccountListDetailService {

  constructor(private http: HttpClient) { }

  private tenantApiUrl = 'http://localhost:3001/tenant';

  getFullTenantDetails(tenantId: string | number){
    const url = `${this.tenantApiUrl}/${tenantId}`;
    console.log(`[TenantAccountListDetailService] Fetching data from: ${url}`);
    return this.http.get<fullTenantDetailData>(url, {withCredentials: true});
  }
}
