import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkHistoryComponent } from './work-history.component';

describe('WorkHistoryComponent', () => {
  let component: WorkHistoryComponent;
  let fixture: ComponentFixture<WorkHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkHistoryComponent]
    });
    fixture = TestBed.createComponent(WorkHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
