import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private apiUrl = 'http://localhost:5000/api';

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getHeaders(): HttpHeaders {
        const token = this.authService.getToken();
        let headers = new HttpHeaders({
            'Content-Type': 'application/json'
        });
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    get(endpoint: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
    }

    post(endpoint: string, data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/${endpoint}`, data, { headers: this.getHeaders() });
    }

    // For file upload
    postFile(endpoint: string, data: any): Observable<any> {
        const token = this.authService.getToken();
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        // Content-Type multipart/form-data is set automatically by browser
        return this.http.post(`${this.apiUrl}/${endpoint}`, data, { headers: headers });
    }

    put(endpoint: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/${endpoint}`, data, { headers: this.getHeaders() });
    }

    delete(endpoint: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${endpoint}`, { headers: this.getHeaders() });
    }
}
