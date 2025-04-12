import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainTenantDashboardComponent } from './main-tenant-dashboard.component';

describe('MainTenantDashboardComponent', () => {
  let component: MainTenantDashboardComponent;
  let fixture: ComponentFixture<MainTenantDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainTenantDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainTenantDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
