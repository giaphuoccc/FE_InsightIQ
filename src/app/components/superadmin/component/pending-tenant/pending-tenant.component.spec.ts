import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingTenantComponent } from './pending-tenant.component';

describe('PendingTenantComponent', () => {
  let component: PendingTenantComponent;
  let fixture: ComponentFixture<PendingTenantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingTenantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingTenantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
