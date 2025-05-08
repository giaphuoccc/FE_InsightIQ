import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainSuperadminDashboardComponent } from './main-superadmin-dashboard.component';

describe('MainSuperadminDashboardComponent', () => {
  let component: MainSuperadminDashboardComponent;
  let fixture: ComponentFixture<MainSuperadminDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainSuperadminDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainSuperadminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
