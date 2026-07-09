import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private readonly API = 'https://localhost:7174/api/Cards';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  getMyCards(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/mycards`, { headers: this.getHeaders() });
  }

  applyCard(accountId: number, cardType: string, pin: string): Observable<any> {
    const body = { accountId, cardType, pin };
    return this.http.post<any>(`${this.API}/apply`, body, { headers: this.getHeaders() });
  }

  toggleBlock(cardId: number): Observable<any> {
    return this.http.put<any>(`${this.API}/toggleblock/${cardId}`, {}, { headers: this.getHeaders() });
  }

  updateLimits(cardId: number, dailyAtmLimit: number, dailyOnlineLimit: number): Observable<any> {
    const body = { dailyAtmLimit, dailyOnlineLimit };
    return this.http.put<any>(`${this.API}/limits/${cardId}`, body, { headers: this.getHeaders() });
  }

  updatePin(cardId: number, oldPin: string, newPin: string): Observable<any> {
    const body = { oldPin, newPin };
    return this.http.put<any>(`${this.API}/pin/${cardId}`, body, { headers: this.getHeaders() });
  }
}
