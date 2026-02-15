import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
    stats: any = {
        totalTests: 0,
        totalStudents: 0,
        avgScore: 0,
        recentAttempts: []
    };
    isLoading = true;

    constructor(private api: ApiService) { }

    ngOnInit() {
        this.api.get('admin/stats').subscribe({
            next: (data) => {
                this.stats = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
            }
        });
    }
}
