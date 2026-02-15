import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-create-test',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './create-test.component.html'
})
export class CreateTestComponent {
    test = {
        title: '',
        duration: 30,
        totalQuestions: 10,
        shuffleQuestions: true,
        shuffleOptions: true,
        accessCode: ''
    };
    isLoading = false;

    constructor(private api: ApiService, private router: Router) { }

    onSubmit() {
        this.isLoading = true;
        // Currently we don't select specific questions, we let the backend handle randomization 
        // from the pool or we could implement a selection UI later.
        // For now, passing empty selection means random pool.

        this.api.post('tests', this.test).subscribe({
            next: (data) => {
                this.isLoading = false;
                alert('Test Created! Link: /test/' + data.uniqueLink);
                this.router.navigate(['/admin']);
            },
            error: (err) => {
                this.isLoading = false;
                alert('Failed to create test');
            }
        });
    }
}
