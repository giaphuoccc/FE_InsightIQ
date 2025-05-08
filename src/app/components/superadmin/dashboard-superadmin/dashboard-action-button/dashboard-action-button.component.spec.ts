import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardActionButtonComponent } from './dashboard-action-button.component';

describe('DashboardActionButtonComponent', () => {
  let component: DashboardActionButtonComponent;
  let fixture: ComponentFixture<DashboardActionButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardActionButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardActionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
