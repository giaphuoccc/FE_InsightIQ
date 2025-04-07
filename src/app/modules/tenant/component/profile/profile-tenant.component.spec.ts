import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileTenantComponent } from './profile-tenant.component';

describe('ProfileTenantComponent', () => {
  let component: ProfileTenantComponent;
  let fixture: ComponentFixture<ProfileTenantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileTenantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileTenantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
