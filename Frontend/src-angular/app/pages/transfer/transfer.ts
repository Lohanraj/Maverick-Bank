import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

@Component({
  selector: 'app-transfer',

  standalone: true,

  imports: [
    FormsModule,
    HttpClientModule
  ],

  templateUrl: './transfer.html',

  styleUrl: './transfer.css'
})

export class Transfer {

  toAccountId: number = 0;

  amount: number = 0;

  constructor(private http: HttpClient)
  {

  }

  transfer()
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
      fromAccountId: 1005,

      toAccountId:
        this.toAccountId,

      amount:
        this.amount
    };

    this.http.post(
      'https://localhost:7174/api/Accounts/transfer',
      body,
      { headers })

      .subscribe({

        next: (response) =>
        {
          alert('Transfer Successful');

          console.log(response);
        },

        error: (error) =>
        {
          alert('Transfer Failed');

          console.log(error);
        }

      });
  }

}