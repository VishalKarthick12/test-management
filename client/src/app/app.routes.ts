import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { QuestionBankComponent } from './components/question-bank/question-bank.component';
import { CreateTestComponent } from './components/create-test/create-test.component';
import { TestInstructionsComponent } from './components/test-instructions/test-instructions.component';
import { TestEngineComponent } from './components/test-engine/test-engine.component';
import { ResultPageComponent } from './components/result-page/result-page.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'admin', component: AdminDashboardComponent },
    { path: 'admin/question-bank', component: QuestionBankComponent },
    { path: 'admin/create-test', component: CreateTestComponent },
    { path: 'student', component: StudentDashboardComponent },
    { path: 'test/:link', component: TestInstructionsComponent },
    { path: 'test/:link/take', component: TestEngineComponent },
    { path: 'result/:attemptId', component: ResultPageComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
