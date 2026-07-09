import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './deposit.html',
  styleUrl: './deposit.css'
})
export class DepositComponent {

  amount: number = 0;

  constructor(private http: HttpClient)
  {

  }

  deposit()
  {
    const token =
      localStorage.getItem('token');

    const headers =
      new HttpHeaders({
        Authorization:
          `Bearer ${token}`
      });

    const body =
    {
      accountId: 3,
      amount: this.amount
    };

    this.http.post(
      'https://localhost:7174/api/v1/Accounts/deposit',
      body,
      { headers })

      .subscribe({

        next: (response) =>
        {
          console.log(response);

          alert('Deposit Successful');
        },

        error: (error) =>
        {
          console.log(error);

          alert('Deposit Failed');
        }

      });
  }
}