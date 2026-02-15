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

    constructor(private authService: AuthService, private router: Router) { }

    validateEmail() {
        if (this.email && !this.email.endsWith('@ltts.com')) {
            // Don't show error immediately while typing, maybe on blur or submit
            // But for visual feedback we can check
        }
    }

    onSubmit() {
        this.error = '';

        if (!this.email.endsWith('@ltts.com')) {
            this.error = 'Email must be an @ltts.com address';
            return;
        }

        this.isLoading = true;
        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: (user) => {
                this.isLoading = false;
                if (user.role === 'admin') {
                    this.router.navigate(['/admin']);
                } else {
                    this.router.navigate(['/student']);
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.error = err.error?.message || 'Login failed';
            }
        });
    }
}
