import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillingHistoryDetailComponent } from './billing-history-detail.component';

describe('BillingHistoryDetailComponent', () => {
  let component: BillingHistoryDetailComponent;
  let fixture: ComponentFixture<BillingHistoryDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingHistoryDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillingHistoryDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
