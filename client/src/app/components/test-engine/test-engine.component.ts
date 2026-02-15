import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-test-engine',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './test-engine.component.html',
    styleUrls: ['./test-engine.component.css']
})
export class TestEngineComponent implements OnInit, OnDestroy {
    attemptId: string | null = null;
    attempt: any;
    currentQuestionIndex = 0;
    timeLeft = 0; // seconds
    timerSubscription: Subscription | null = null;
    autoSaveSubscription: Subscription | null = null;

    questions: any[] = [];
    answers: any[] = [];

    isFullScreen = false;
    warnings = 0;

    constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state) {
            this.attemptId = nav.extras.state['attemptId'];
        }
    }

    ngOnInit() {
        // If no attemptId in state, try to recover active attempt or error
        if (!this.attemptId) {
            // Fallback: This is tricky if user refreshes. 
            // We really need to persist attemptId in localStorage or fetch "current active attempt" from backend.
            // For now, let's assume valid flow.
            alert("Invalid Session. Please start again from dashboard.");
            this.router.navigate(['/student']);
            return;
        }

        this.loadAttempt();
        this.enterFullScreen();

        // Auto save every 10 seconds
        this.autoSaveSubscription = interval(10000).subscribe(() => {
            this.saveProgress();
        });
    }

    loadAttempt() {
        this.api.get(`attempts/${this.attemptId}`).subscribe({
            next: (data) => {
                this.attempt = data;
                this.questions = this.attempt.test.questions; // populated? No, getAttempt populates test but maybe not questions deep?
                // backend getAttempt populates 'test'. 'test' has 'questions' array of IDs.
                // I need the actual question text.
                // Backend `getAttempt` -> populate('test') -> Test model has `questions` ref.
                // I need to deep populate `test.questions` in backend `getAttempt`.

                // Assuming I fix backend or have data:
                // Let's Init answers map

                // Calculate time left
                const elapsed = Math.floor((Date.now() - new Date(this.attempt.startTime).getTime()) / 1000);
                this.timeLeft = (this.attempt.test.duration * 60) - elapsed;

                this.startTimer();
            }
        });
    }

    startTimer() {
        this.timerSubscription = interval(1000).subscribe(() => {
            if (this.timeLeft > 0) {
                this.timeLeft--;
            } else {
                this.submitTest();
            }
        });
    }

    selectOption(option: string) {
        const qId = this.questions[this.currentQuestionIndex]._id;
        const existing = this.answers.find(a => a.questionId === qId);
        if (existing) {
            existing.selectedOption = option;
        } else {
            this.answers.push({ questionId: qId, selectedOption: option });
        }
    }

    getSelectedOption(index?: number): string | null {
        const targetIndex = index !== undefined ? index : this.currentQuestionIndex;
        const qId = this.questions[targetIndex]?._id;
        const ans = this.answers.find(a => a.questionId === qId);
        return ans ? ans.selectedOption : null;
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
        }
    }

    saveProgress() {
        if (this.attemptId) {
            this.api.put(`attempts/${this.attemptId}/save`, { answers: this.answers }).subscribe();
        }
    }

    submitTest() {
        if (confirm("Are you sure you want to submit?")) {
            this.api.post(`attempts/${this.attemptId}/submit`, { answers: this.answers }).subscribe({
                next: () => {
                    this.router.navigate([`/result/${this.attemptId}`]);
                }
            });
        }
    }

    @HostListener('document:visibilitychange')
    visibilityChange() {
        if (document.hidden) {
            this.warnings++;
            alert(`Warning: Tab switching is monitored. Warning ${this.warnings}/3.`);
            if (this.warnings >= 3) {
                this.submitTest(); // Force submit
            }
        }
    }

    @HostListener('contextmenu', ['$event'])
    onRightClick(event: MouseEvent) {
        event.preventDefault();
    }

    enterFullScreen() {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
            this.isFullScreen = true;
        }
    }

    ngOnDestroy() {
        this.timerSubscription?.unsubscribe();
        this.autoSaveSubscription?.unsubscribe();
    }

    get formattedTime() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
}
