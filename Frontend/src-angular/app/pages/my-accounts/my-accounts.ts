import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpResponse
} from '@angular/common/http';

@Component({
  selector: 'app-my-accounts',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './my-accounts.html',
  styleUrl: './my-accounts.css'
})
export class MyAccountsComponent implements OnInit {

  accounts: any[] = [];

  constructor(private http: HttpClient)
  {

  }

  ngOnInit()
  {
    console.log(
      'MY ACCOUNTS COMPONENT LOADED'
    );

    this.loadAccounts();
  }

  loadAccounts()
  {
    const token =
      localStorage.getItem('token');

    console.log(
      'TOKEN:',
      token
    );

    console.log(
      'ROLE:',
      localStorage.getItem('role')
    );

    if (!token)
    {
      alert(
        'No token found. Please login again.'
      );

      return;
    }

    const headers =
      new HttpHeaders({
        Authorization:
          `Bearer ${token}`
      });

    console.log(
      'AUTH HEADER:',
      `Bearer ${token}`
    );

    this.http.get<any[]>(
      'https://localhost:7174/api/v1/Accounts/myaccounts',
      {
        headers,
        observe: 'response'
      }
    )
    .subscribe({

      next: (response: HttpResponse<any[]>) =>
      {
        console.log(
          'FULL RESPONSE:',
          response
        );

        console.log(
          'STATUS:',
          response.status
        );

        console.log(
          'BODY:',
          response.body
        );

        this.accounts =
          response.body || [];

        console.log(
          'ACCOUNTS:',
          this.accounts
        );

        console.log(
          'TOTAL:',
          this.accounts.length
        );
      },

      error: (error) =>
      {
        console.log(
          'FULL ERROR:',
          error
        );

        console.log(
          'STATUS:',
          error.status
        );

        console.log(
          'MESSAGE:',
          error.message
        );

        console.log(
          'ERROR BODY:',
          error.error
        );

        console.log(
          'HEADERS:',
          error.headers
        );

        alert(
          `Failed: ${error.status}`
        );
      }

    });
  }
}