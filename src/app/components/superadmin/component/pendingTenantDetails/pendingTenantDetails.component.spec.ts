import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingTenantDetailsComponent } from './pendingTenantDetails.component';

describe('PendingTenantDetailsComponent', () => {
  let component: PendingTenantDetailsComponent;
  let fixture: ComponentFixture<PendingTenantDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingTenantDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingTenantDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
