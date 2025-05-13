import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface TenantDTO{
  id: number;
  companyName: string;
  fullName: string;
  taxId: string;
  status: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class TenantAccountListService {
  
  private tenantApiUrl = 'http://localhost:3001/tenant';
  private userApiUrl = 'http://localhost:3001/user';

  // Inject HttpClient để gọi API
  constructor(private http: HttpClient) { }

  // Phương thức lấy danh sách tất cả Tenant cơ bản
  getAllTenant(): Observable<any[]>{
    return this.http.get<any[]>(`${this.tenantApiUrl}`, {withCredentials: true});
  }

  // Phương thức lấy chi tiết user theo id
  getUserDetail(userId: number): Observable<any>{
    // Gọi đến userApiUrl với userId cụ thể
    return this.http.get<any>(`${this.userApiUrl}/${userId}`, {withCredentials: true});
  }

  // Phương thức cập nhật trạng thái Tenant
  updateTenantStatus(tenantId: number, tenantDto: TenantDTO): Observable<any>{
    return this.http.put<any>(`${this.tenantApiUrl}/${tenantId}`, tenantDto, {withCredentials: true});
  }
}
