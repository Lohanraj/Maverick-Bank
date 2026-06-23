import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

@Component({
  selector: 'app-transactions',

  standalone: true,

  imports: [
    CommonModule,
    HttpClientModule
  ],

  templateUrl: './transactions.html',

  styleUrl: './transactions.css'
})

export class Transactions implements OnInit {

  transactions: any[] = [];

  constructor(private http: HttpClient)
  {

  }

  ngOnInit()
  {
    this.loadTransactions();
  }

  loadTransactions()
  {
    const token =
      localStorage.getItem('token');

    const headers =
      new HttpHeaders({
        Authorization:
          `Bearer ${token}`
      });

    this.http.get<any[]>(
      'https://localhost:7174/api/v1/Accounts/transactions/3',
      { headers })

      .subscribe({

        next: (response) =>
        {
          console.log(JSON.stringify(response, null, 2));

          this.transactions = response;
        },

        error: (error) =>
        {
          console.log(error);

          alert('Failed to load transactions');
        }

      });
  }
}