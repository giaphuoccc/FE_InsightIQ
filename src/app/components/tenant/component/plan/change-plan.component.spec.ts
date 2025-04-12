import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePlanComponent } from './change-plan.component';

describe('ChangePlanComponent', () => {
  let component: ChangePlanComponent;
  let fixture: ComponentFixture<ChangePlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangePlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangePlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
