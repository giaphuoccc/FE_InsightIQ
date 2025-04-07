import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantAccountListComponent } from './tenant-account-list.component';

describe('TenantAccountListComponent', () => {
  let component: TenantAccountListComponent;
  let fixture: ComponentFixture<TenantAccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantAccountListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenantAccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
