import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // Import module test HTTP
import { FormsModule } from '@angular/forms'; // Import FormsModule nếu template dùng ngModel
import { CommonModule } from '@angular/common';

import { DocumentManagementComponent } from './document-management.component';
// Import service nếu cần mock
// import { DocumentService } from '../../services/document.service';

// ✅ Định nghĩa lại interface hoặc import từ component nếu có thể
interface DisplayDocument {
  id?: number;
  name: string;
  modified: string;
  size: string;
  fileUrl?: string;
}

describe('DocumentManagementComponent', () => {
  let component: DocumentManagementComponent;
  let fixture: ComponentFixture<DocumentManagementComponent>;
  // Khai báo mock service nếu cần test tương tác với service
  // let mockDocumentService: jasmine.SpyObj<DocumentService>;

  beforeEach(async () => {
    // Tạo mock cho service nếu cần
    // mockDocumentService = jasmine.createSpyObj('DocumentService', ['uploadDocument', 'getDocuments', 'deleteDocument']);

    await TestBed.configureTestingModule({
      // Khai báo component standalone và các imports cần thiết cho test
      imports: [
        DocumentManagementComponent, // Import component standalone
        HttpClientTestingModule,     // Cần cho service nếu nó dùng HttpClient
        FormsModule,                 // Cần nếu template dùng ngModel
        CommonModule
      ],
      // Cung cấp mock service nếu cần
      // providers: [
      //   { provide: DocumentService, useValue: mockDocumentService }
      // ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentManagementComponent);
    component = fixture.componentInstance;

    // ✅ Cung cấp dữ liệu mock khớp với interface DisplayDocument
    const mockDocs: DisplayDocument[] = [
      { id: 1, name: 'test1.pdf', modified: '2025-01-01', size: '10MB', fileUrl: 'http://example.com/test1.pdf' },
      { id: 2, name: 'test2.pdf', modified: '2025-01-02', size: '5MB', fileUrl: undefined }, // Có thể không có URL
      { id: undefined, name: 'sample.pdf', modified: '2025-01-03', size: '1MB', fileUrl: undefined } // Có thể không có ID (dữ liệu mẫu)
    ];
    component.documents = mockDocs; // Gán dữ liệu mock cho component

    fixture.detectChanges(); // Kích hoạt change detection ban đầu
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Thêm các test case khác ở đây nếu cần
  // Ví dụ: test hàm onDelete, onUpload, onFileSelected...
  it('should display initial documents', () => {
    const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
    // Kiểm tra số lượng dòng khớp với mock data (trừ dòng "Chưa có tài liệu")
    expect(tableRows.length).toBe(component.documents.length);
    // Kiểm tra nội dung dòng đầu tiên chẳng hạn
    const firstRowCells = tableRows[0].querySelectorAll('td');
    expect(firstRowCells[0].textContent).toContain('test1.pdf');
    expect(firstRowCells[1].textContent).toContain('2025-01-01');
    expect(firstRowCells[2].textContent).toContain('10MB');
  });

  // Test hàm onDelete (ví dụ đơn giản xóa khỏi mảng)
  it('should remove a document when onDelete is called', () => {
    const initialLength = component.documents.length;
    component.onDelete(0); // Gọi hàm xóa phần tử đầu tiên
    fixture.detectChanges(); // Cập nhật view
    const tableRows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(component.documents.length).toBe(initialLength - 1);
    expect(tableRows.length).toBe(initialLength - 1);
  });

  // Bạn có thể viết thêm test cho onFileSelected và onUpload (cần mock service phức tạp hơn)

});
