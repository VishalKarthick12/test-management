import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgClass, CommonModule } from '@angular/common'; // Import CommonModule
import { CursorComponent } from './components/cursor/cursor.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, CursorComponent, CommonModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    title = 'LTTS Test Portal';
    darkMode = false;

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}
