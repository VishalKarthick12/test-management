import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    email = '';
    password = '';
    error = '';
    isLoading = false;

    constructor(private authService: AuthService, private router: Router) {
        // If already logged in, redirect to admin
        const user = this.authService.getUser();
        if (user && user.role === 'admin') {
            this.router.navigate(['/admin']);
        }
    }

    onSubmit() {
        this.error = '';
        this.isLoading = true;

        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: (user) => {
                this.isLoading = false;
                if (user.role === 'admin') {
                    this.router.navigate(['/admin']);
                } else {
                    this.error = 'Only admin accounts can log in here.';
                    this.authService.logout();
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.error = err.error?.message || 'Invalid credentials';
            }
        });
    }
}
