import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class TenantServiceService {

  constructor(private http: HttpClient) { }

  private myInfoUrl = 'http://localhost:3001/tenant/api/myInfo';
  private tenantDetailsBaseUrl = 'http://localhost:3001/tenant/';
  
  private getMyInfo() {
  return this.http.get<any>(this.myInfoUrl, { withCredentials: true });
}
private getTenantDetails(tenantId: number) {
  const url = `${this.tenantDetailsBaseUrl}${tenantId}`;
  return this.http.get<any>(url, { withCredentials: true });
}

getTenantFullName(): Observable<string> {
  return this.getMyInfo().pipe(
    switchMap(myInfo => {
      // Kiểm tra tenantId có hợp lệ không
      if (myInfo && typeof myInfo.tenantId === 'number') {
        return this.getTenantDetails(myInfo.tenantId);
      } else {
        return throwError(() => new Error('Tenant ID not found'));
      }
    }),
    map(tenantDetails => tenantDetails.fullName || 'Tenant'),
    catchError(err => {
      console.error('Lỗi khi lấy fullName:', err);
      return throwError(() => new Error('Không lấy được tên tenant'));
    })
  );
}

}
