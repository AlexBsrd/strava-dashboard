import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {ChallengeMetric, ChallengeType} from '../../../models/challenge/challenge-enums.model';
import {Challenge} from "../../../models/challenge/challenge.model";
import {MockChallengeService} from "../../../services/mock-challenge.service";

@Component({
  selector: 'app-challenge-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './challenge-create.component.html',
  styleUrls: ['./challenge-create.component.css']
})
export class ChallengeCreateComponent {
  challengeForm!: FormGroup;
  challengeTypes = Object.values(ChallengeType);
  challengeMetrics = Object.values(ChallengeMetric);
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private challengeService: MockChallengeService,
    public router: Router
  ) {
    this.initForm();
  }

  onSubmit(): void {
    if (this.challengeForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.challengeForm.value;
      const challenge = {
        ...formValue,
        startDate: new Date(formValue.startDate),
        endDate: new Date(formValue.endDate)
      };

      this.challengeService.createChallenge(challenge).subscribe({
        next: (createdChallenge: Challenge) => {
          this.router.navigate(['/challenges', createdChallenge.id]);
        },
        error: (error: any) => {
          console.error('Error creating challenge:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  private initForm(): void {
    this.challengeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      type: [ChallengeType.DISTANCE, Validators.required],
      goal: [null, [Validators.required, Validators.min(1)]],
      metric: [ChallengeMetric.KILOMETERS, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isPrivate: [false]
    }, {
      validators: this.dateRangeValidator
    });
  }

  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return startDate < endDate ? null : {dateRange: true};
    }
    return null;
  }
}
