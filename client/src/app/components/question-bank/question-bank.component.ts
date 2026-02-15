import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Router, RouterLink } from '@angular/router';

@Component({
    selector: 'app-question-bank',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './question-bank.component.html'
})
export class QuestionBankComponent implements OnInit {
    questions: any[] = [];
    savedQuestions: any[] = [];
    isUploading = false;
    file: File | null = null;
    error = '';
    success = '';
    showSaved = false;
    savedLoading = false;

    constructor(private api: ApiService, private router: Router) { }

    ngOnInit() {
        this.loadSavedQuestions();
    }

    loadSavedQuestions() {
        this.savedLoading = true;
        this.api.get('tests/questions/all').subscribe({
            next: (data) => {
                this.savedQuestions = data;
                this.savedLoading = false;
            },
            error: () => this.savedLoading = false
        });
    }

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
                this.success = `${this.questions.length} questions saved successfully!`;
                this.questions = [];
                this.file = null;
                this.loadSavedQuestions();
            },
            error: (err) => {
                this.error = 'Failed to save questions.';
                this.isUploading = false;
            }
        });
    }

    deleteQuestion(q: any) {
        if (confirm(`Delete question: "${q.text.substring(0, 60)}..."?`)) {
            this.api.delete(`tests/questions/${q._id}`).subscribe({
                next: () => {
                    this.savedQuestions = this.savedQuestions.filter(sq => sq._id !== q._id);
                    this.success = 'Question deleted.';
                },
                error: () => this.error = 'Failed to delete question.'
            });
        }
    }

    deleteAllQuestions() {
        if (confirm(`DELETE ALL ${this.savedQuestions.length} QUESTIONS?\n\nThis cannot be undone!`)) {
            this.api.delete('tests/questions/all').subscribe({
                next: (data: any) => {
                    this.savedQuestions = [];
                    this.success = data.message;
                },
                error: () => this.error = 'Failed to delete questions.'
            });
        }
    }

    downloadTemplate() {
        this.api.getBlob('admin/sample-template').subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'question_template.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => this.error = 'Failed to download template.'
        });
    }
}
