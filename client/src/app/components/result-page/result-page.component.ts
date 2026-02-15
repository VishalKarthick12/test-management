import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-result-page',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './result-page.component.html'
})
export class ResultPageComponent implements OnInit {
    attempt: any;
    loading = true;
    passed = false;
    percentage = 0;

    constructor(private route: ActivatedRoute, private api: ApiService) { }

    ngOnInit() {
        const attemptId = this.route.snapshot.paramMap.get('attemptId');
        if (attemptId) {
            this.api.get(`attempts/${attemptId}`).subscribe({
                next: (data) => {
                    this.attempt = data;
                    this.loading = false;
                    this.calculateResult();
                },
                error: (err) => {
                    console.error(err);
                    this.loading = false;
                }
            });
        }
    }

    calculateResult() {
        this.percentage = (this.attempt.score / this.attempt.totalQuestions) * 100;
        this.passed = this.percentage >= 60;

        if (this.passed) {
            this.triggerConfetti();
        }
    }

    triggerConfetti() {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }

    downloadCertificate() {
        const doc = new jsPDF();

        // Background (Simple border)
        doc.setLineWidth(2);
        doc.rect(10, 10, 190, 277);

        // Header
        doc.setFontSize(24);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text("LTTS Test Portal", 105, 40, { align: "center" });

        // Title
        doc.setFontSize(30);
        doc.setTextColor(0, 0, 0);
        doc.text("Certificate of Completion", 105, 70, { align: "center" });

        // Content
        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text("This is to certify that", 105, 100, { align: "center" });

        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text(this.attempt.student.name, 105, 120, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text("has successfully passed the test", 105, 140, { align: "center" });

        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(this.attempt.test.title, 105, 160, { align: "center" });

        doc.setFontSize(16);
        doc.setFont("helvetica", "normal");
        doc.text(`Score: ${this.percentage.toFixed(0)}%`, 105, 180, { align: "center" });

        doc.text(`Date: ${new Date(this.attempt.endTime).toLocaleDateString()}`, 105, 200, { align: "center" });

        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text("Verified by LTTS Assessment System", 105, 260, { align: "center" });

        doc.save(`certificate_${this.attempt.student.name}.pdf`);
    }
}
