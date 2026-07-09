import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  HttpClient,
  HttpClientModule,
  HttpHeaders
} from '@angular/common/http';

@Component({
  selector: 'app-mini-statement',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './mini-statement.html',
  styleUrl: './mini-statement.css'
})
export class MiniStatementComponent implements OnInit {

  transactions: any[] = [];

  randomNumber =
    Math.floor(Math.random() * 10000);

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit()
  {
    console.log(
      'RANDOM:',
      this.randomNumber
    );

    this.loadMiniStatement();
  }

  loadMiniStatement()
  {
    const token =
      localStorage.getItem('token');

    const headers =
      new HttpHeaders({
        Authorization:
          `Bearer ${token}`
      });

    this.http.get<any[]>(
      'https://localhost:7174/api/v1/Accounts/ministatement/1005',
      { headers }
    )
    .subscribe({

      next: (response) =>
      {
        console.log(
          'API RESPONSE:',
          response
        );

        this.transactions = [...response];

        console.log(
          'TRANSACTIONS:',
          this.transactions
        );

        console.log(
          'TOTAL:',
          this.transactions.length
        );

        this.cdr.detectChanges();
      },

      error: (error) =>
      {
        console.log(error);

        alert(
          'Failed to load mini statement'
        );
      }

    });
  }
}