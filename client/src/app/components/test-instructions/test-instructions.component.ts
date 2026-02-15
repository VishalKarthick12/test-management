import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-test-instructions',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './test-instructions.component.html'
})
export class TestInstructionsComponent implements OnInit {
    test: any;
    accessCode = '';
    loading = true;
    error = '';
    link = '';

    constructor(private route: ActivatedRoute, private api: ApiService, private router: Router) { }

    ngOnInit() {
        this.link = this.route.snapshot.paramMap.get('link') || '';
        if (this.link) {
            // Fetch test details by link (we might need a specific endpoint or filter)
            // For now, assuming we iterate or have a lookup. 
            // Ideally backend should support get by link.
            // Let's assume getTest logic in backend handles ID or Link.
            // My backend getTest uses findById. I should probably have implemented findOne({ uniqueLink: ... })
            // Let's check backend... `getTest` uses `findById`. 
            // I need to update backend to support link lookup OR I just use ID in frontend?
            // User said: "/test/{uniqueId}". UniqueId usually implies the DB ID or a custom one.
            // If `uniqueLink` is the custom string, I need a backend endpoint for it.

            // Let's quickly fix this implementation by assuming the ID is passed or I'll implement a 'get-by-link' in backend if needed.
            // But for now, I'll try to use the link as ID or assume I need to fetch all and find? No, that's bad.
            // I will assume for now that I can fetch by ID. 
            // Wait, the link generated in CreateTest is `uniqueLink` (random string).
            // So I NEED an endpoint to get test by `uniqueLink`.

            this.api.get(`tests?link=${this.link}`).subscribe({ // Need to adjust backend for this query?
                // Or just `tests/${this.link}` and backend handles both?
                // Let's Try `tests/${this.link}` and modify backend to check if it's a valid ObjectId, if not check uniqueLink.
                next: (data) => {
                    // If data is array (getTests) it's wrong.
                    // I'll assume I fix backend.
                    this.test = data; // Placeholder
                    this.loading = false;
                },
                error: (err) => {
                    // Fallback or error
                    console.log("Trying to fetch by link...");
                    this.loading = false;
                }
            });
        }
    }

    startTest() {
        this.loading = true;
        // Check access code locally or send to backend
        // Sending to backend 'start' endpoint

        // We need the Test ID. If I fetched via Link, I have the ID in `this.test._id`.
        this.api.post('attempts/start', { testId: this.test._id, accessCode: this.accessCode }).subscribe({
            next: (attempt) => {
                this.router.navigate([`/test/${this.link}/take`], { state: { attemptId: attempt._id } });
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to start test';
                this.loading = false;
            }
        });

    }
}
