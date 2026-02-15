import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
    stats: any = {
        totalTests: 0,
        uniqueStudents: 0,
        avgScore: 0,
        totalQuestions: 0,
        recentAttempts: []
    };
    tests: any[] = [];
    isLoading = true;
    copiedLink = '';

    constructor(private api: ApiService, private authService: AuthService) { }

    ngOnInit() {
        this.loadStats();
        this.loadTests();
    }

    loadStats() {
        this.api.get('admin/stats').subscribe({
            next: (data) => {
                this.stats = data;
            },
            error: (err) => console.error(err)
        });
    }

    loadTests() {
        this.api.get('tests').subscribe({
            next: (data) => {
                this.tests = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }

    getShareUrl(test: any): string {
        return `${window.location.origin}/test/${test.uniqueLink}`;
    }

    copyLink(test: any) {
        const url = this.getShareUrl(test);
        navigator.clipboard.writeText(url).then(() => {
            this.copiedLink = test._id;
            setTimeout(() => this.copiedLink = '', 2000);
        });
    }

    deleteTest(test: any) {
        const msg = `Delete "${test.title}"?\n\nThis will permanently delete the test and all ${test.attemptCount || 0} student attempts. This cannot be undone.`;
        if (confirm(msg)) {
            this.api.delete(`tests/${test._id}`).subscribe({
                next: () => {
                    this.tests = this.tests.filter(t => t._id !== test._id);
                    this.loadStats(); // Refresh stats
                },
                error: () => alert('Failed to delete test')
            });
        }
    }

    toggleTest(test: any) {
        this.api.put(`tests/${test._id}/toggle`, {}).subscribe({
            next: (updated: any) => {
                test.isActive = updated.isActive;
            },
            error: () => alert('Failed to toggle test')
        });
    }

    logout() {
        this.authService.logout();
    }
}
