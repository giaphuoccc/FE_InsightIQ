import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProfileTEComponent } from './edit-profile-te.component';

describe('EditProfileTEComponent', () => {
  let component: EditProfileTEComponent;
  let fixture: ComponentFixture<EditProfileTEComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileTEComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditProfileTEComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
