import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-question-bank',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './question-bank.component.html'
})
export class QuestionBankComponent {
    questions: any[] = [];
    isUploading = false;
    file: File | null = null;
    error = '';
    success = '';

    constructor(private api: ApiService, private router: Router) { }

    onFileSelected(event: any) {
        this.file = event.target.files[0];
        this.error = '';
        this.success = '';
    }

    uploadFile() {
        if (!this.file) {
            this.error = 'Please select a file first.';
            return;
        }

        this.isUploading = true;
        const formData = new FormData();
        formData.append('file', this.file);

        this.api.postFile('tests/upload-questions', formData).subscribe({
            next: (data) => {
                this.questions = data;
                this.isUploading = false;
                this.success = 'File parsed successfully. Review questions below before saving.';
            },
            error: (err) => {
                this.error = 'Failed to upload/parse file.';
                this.isUploading = false;
                console.error(err);
            }
        });
    }

    saveQuestions() {
        if (this.questions.length === 0) return;

        this.isUploading = true;
        this.api.post('tests/create-questions', this.questions).subscribe({
            next: (data) => {
                this.isUploading = false;
                alert('Questions saved successfully!');
                this.questions = [];
                this.file = null;
                this.router.navigate(['/admin']);
            },
            error: (err) => {
                this.error = 'Failed to save questions.';
                this.isUploading = false;
            }
        });
    }
}
