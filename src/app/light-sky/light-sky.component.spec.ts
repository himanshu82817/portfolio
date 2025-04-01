import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightSkyComponent } from './light-sky.component';

describe('LightSkyComponent', () => {
  let component: LightSkyComponent;
  let fixture: ComponentFixture<LightSkyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightSkyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LightSkyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
