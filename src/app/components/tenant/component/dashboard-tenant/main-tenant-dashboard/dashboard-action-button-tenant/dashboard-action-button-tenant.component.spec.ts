import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardActionButtonComponentTenant } from './dashboard-action-button-tenant.component';

describe('DashboardActionButtonComponent', () => {
  let component: DashboardActionButtonComponentTenant;
  let fixture: ComponentFixture<DashboardActionButtonComponentTenant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardActionButtonComponentTenant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardActionButtonComponentTenant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
