import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'token';
  private readonly ROLE_KEY = 'role';
  private readonly USER_KEY = 'user';

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  getUser(): any {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  }

  getUserName(): string {
    const user = this.getUser();
    return user?.fullName || user?.email || 'User';
  }

  getUserEmail(): string {
    const user = this.getUser();
    return user?.email || '';
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  isCustomer(): boolean {
    return this.getRole() === 'Customer';
  }

  isEmployee(): boolean {
    return this.getRole() === 'Employee';
  }

  isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  getInitials(): string {
    const name = this.getUserName();
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  logout(): void {
    localStorage.clear();
  }
}
