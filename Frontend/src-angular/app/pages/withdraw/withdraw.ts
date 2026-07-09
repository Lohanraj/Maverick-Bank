import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './withdraw.html',
  styleUrl: './withdraw.css'
})
export class WithdrawComponent {

  amount: number = 0;

  constructor(private http: HttpClient) {}

  withdraw() {

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const body = {
      accountId: 1005,
      amount: this.amount
    };

    this.http.post(
      'https://localhost:7174/api/v1/Accounts/withdraw',
      body,
      { headers }
    ).subscribe({

      next: (response) => {
        console.log(response);
        alert('Withdrawal Successful');
      },

      error: (error) => {
        console.log(error);
        alert('Withdrawal Failed');
      }

    });
  }
}