import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TenantAccountDetailsComponent } from './tenant-account-details.component';

describe('TenantAccountDetailsComponent', () => {
  let component: TenantAccountDetailsComponent;
  let fixture: ComponentFixture<TenantAccountDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantAccountDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TenantAccountDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
