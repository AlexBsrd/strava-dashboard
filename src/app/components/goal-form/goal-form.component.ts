import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Goal, GoalType, GoalPeriod } from '../../models/goal';
import { getSportMetadata } from '../../types/sport-config';

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './goal-form.component.html',
  styleUrl: './goal-form.component.css'
})
export class GoalFormComponent implements OnInit {
  @Input() goal: Goal | null = null; // For edit mode
  @Input() availableSports: string[] = [];
  @Output() save = new EventEmitter<Partial<Goal>>();
  @Output() cancel = new EventEmitter<void>();

  goalForm!: FormGroup;
  isEditMode = false;

  goalTypes: { value: GoalType; labelKey: string; unitKey: string }[] = [
    { value: 'distance', labelKey: 'goals.form.type_distance', unitKey: 'units.km' },
    { value: 'time', labelKey: 'goals.form.type_time', unitKey: 'goals.form.target_hours' },
    { value: 'count', labelKey: 'goals.form.type_count', unitKey: 'goals.form.target_activities' }
  ];

  periods: { value: GoalPeriod; labelKey: string }[] = [
    { value: 'week', labelKey: 'goals.form.period_week' },
    { value: 'month', labelKey: 'goals.form.period_month' },
    { value: 'year', labelKey: 'goals.form.period_year' },
    { value: 'custom', labelKey: 'goals.form.period_custom' }
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.isEditMode = !!this.goal;
    this.initForm();
  }

  private initForm(): void {
    this.goalForm = this.fb.group({
      name: [this.goal?.name || '', [Validators.required, Validators.maxLength(50)]],
      type: [this.goal?.type || 'distance', Validators.required],
      target: [this.goal?.target || 100, [Validators.required, Validators.min(1)]],
      period: [this.goal?.period || 'month', Validators.required],
      sportTypes: [this.goal?.sportTypes || []],
      startDate: [this.goal?.startDate ? this.formatDateForInput(this.goal.startDate) : ''],
      endDate: [this.goal?.endDate ? this.formatDateForInput(this.goal.endDate) : '']
    });

    // Watch period changes to show/hide custom date fields
    this.goalForm.get('period')?.valueChanges.subscribe(period => {
      if (period === 'custom') {
        this.goalForm.get('startDate')?.setValidators(Validators.required);
        this.goalForm.get('endDate')?.setValidators(Validators.required);
      } else {
        this.goalForm.get('startDate')?.clearValidators();
        this.goalForm.get('endDate')?.clearValidators();
      }
      this.goalForm.get('startDate')?.updateValueAndValidity();
      this.goalForm.get('endDate')?.updateValueAndValidity();
    });
  }

  get selectedType(): GoalType {
    return this.goalForm.get('type')?.value;
  }

  get selectedPeriod(): GoalPeriod {
    return this.goalForm.get('period')?.value;
  }

  get currentUnitKey(): string {
    const type = this.goalTypes.find(t => t.value === this.selectedType);
    return type?.unitKey || '';
  }

  onSportToggle(sport: string): void {
    const sportTypes = this.goalForm.get('sportTypes')?.value || [];
    const index = sportTypes.indexOf(sport);

    if (index === -1) {
      sportTypes.push(sport);
    } else {
      sportTypes.splice(index, 1);
    }

    this.goalForm.patchValue({ sportTypes });
  }

  isSportSelected(sport: string): boolean {
    const sportTypes = this.goalForm.get('sportTypes')?.value || [];
    return sportTypes.includes(sport);
  }

  getSportLabelKey(sport: string): string {
    return getSportMetadata(sport).labelKey;
  }

  onSubmit(): void {
    if (this.goalForm.valid) {
      const formValue = this.goalForm.value;
      const goalData: Partial<Goal> = {
        name: formValue.name,
        type: formValue.type,
        target: formValue.type === 'time' ? formValue.target * 3600 : formValue.target, // Convert hours to seconds
        period: formValue.period,
        sportTypes: formValue.sportTypes.length > 0 ? formValue.sportTypes : undefined
      };

      if (formValue.period === 'custom') {
        goalData.startDate = new Date(formValue.startDate);
        goalData.endDate = new Date(formValue.endDate);
      }

      this.save.emit(goalData);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onOverlayMouseDown(event: MouseEvent): void {
    // Only close if clicking directly on the overlay (not on modal content)
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
