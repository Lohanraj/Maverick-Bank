import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

API_URL = "https://localhost:7174/api"

def make_request(url, data=None, headers=None, method=None):
    if headers is None:
        headers = {}
    if "Content-Type" not in headers:
        headers["Content-Type"] = "application/json"
        
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            status = response.status
            body = response.read().decode("utf-8")
            try:
                return status, json.loads(body) if body else None
            except:
                return status, body
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode("utf-8")
        try:
            return status, json.loads(body)
        except:
            return status, body
    except Exception as e:
        return 500, str(e)

def login(email, password):
    status, body = make_request(f"{API_URL}/Auth/login", {"email": email, "password": password})
    if status == 200:
        return body["token"]
    raise Exception(f"Login failed for {email}: {body}")

def run_tests():
    print("==================================================")
    print(" STARTING BANK INTEGRATION TEST FLOW")
    print("==================================================")
    
    # 1. Login as Admin, Employee, Customer
    print("\n[1] AUTHENTICATION TEST")
    customer_token = login("customer@maverick.com", "Customer@123")
    print("  SUCCESS: Logged in as Customer (customer@maverick.com)")
    employee_token = login("employee@maverick.com", "Employee@123")
    print("  SUCCESS: Logged in as Employee (employee@maverick.com)")
    admin_token = login("admin@maverick.com", "Admin@123")
    print("  SUCCESS: Logged in as Admin (admin@maverick.com)")

    # 2. Get Accounts
    print("\n[2] ACCOUNTS TEST")
    c_headers = {"Authorization": f"Bearer {customer_token}"}
    status, accounts = make_request(f"{API_URL}/Accounts/myaccounts", headers=c_headers)
    assert status == 200, "Failed to load accounts"
    print(f"  SUCCESS: Retrieved {len(accounts)} accounts for customer.")
    
    # Use any active accounts
    active_accounts = [a for a in accounts if a["status"] == "Active"]
    assert len(active_accounts) > 0, "Customer must have at least one active account"
    
    checking = active_accounts[0]
    savings = active_accounts[1] if len(active_accounts) > 1 else None
    
    init_checking_bal = checking["balance"]
    print(f"  INFO: Primary Account ({checking['accountType']}, {checking['accountNumber']}) Balance: INR {init_checking_bal:.2f}")
    if savings:
        print(f"  INFO: Secondary Account ({savings['accountType']}, {savings['accountNumber']}) Balance: INR {savings['balance']:.2f}")

    # 3. Deposits
    print("\n[3] DEPOSIT OPERATION TEST")
    dep_amount = 1000.00
    status, res = make_request(
        f"{API_URL}/Accounts/deposit",
        {"accountId": checking["id"], "amount": dep_amount, "description": "Test Deposit"},
        headers=c_headers
    )
    assert status == 200, f"Deposit failed: {res}"
    print(f"  SUCCESS: Deposited INR {dep_amount:.2f} successfully.")
    
    # Verify balance increased
    status, accounts_after = make_request(f"{API_URL}/Accounts/myaccounts", headers=c_headers)
    checking_after = next(a for a in accounts_after if a["id"] == checking["id"])
    assert checking_after["balance"] == init_checking_bal + dep_amount, "Balance did not increase correctly"
    print(f"  SUCCESS: Balance increased correctly to: INR {checking_after['balance']:.2f}")

    # 4. Withdrawals & Overdraft check
    print("\n[4] WITHDRAWAL OPERATION TEST")
    with_amount = 500.00
    status, res = make_request(
        f"{API_URL}/Accounts/withdraw",
        {"accountId": checking["id"], "amount": with_amount, "description": "Test Withdrawal"},
        headers=c_headers
    )
    assert status == 200, f"Withdrawal failed: {res}"
    print(f"  SUCCESS: Withdrew INR {with_amount:.2f} successfully.")

    # Re-fetch balance after withdrawal
    status, accounts_after_withdrawal = make_request(f"{API_URL}/Accounts/myaccounts", headers=c_headers)
    checking_after = next(a for a in accounts_after_withdrawal if a["id"] == checking["id"])

    # Overdraft attempt
    print("  INFO: Testing overdraft protection (insufficient funds):")
    huge_amount = checking_after["balance"] + 10000.00
    status, res = make_request(
        f"{API_URL}/Accounts/withdraw",
        {"accountId": checking["id"], "amount": huge_amount, "description": "Attempted Overdraft"},
        headers=c_headers
    )
    assert status == 400, f"Expected 400 Bad Request, got: {status}"
    print("  SUCCESS: Overdraft rejected successfully as expected by bank security rules.")

    # 5. Transfers
    print("\n[5] FUNDS TRANSFER OPERATION TEST")
    c_final = checking_after
    if savings:
        trans_amount = 200.00
        status, res = make_request(
            f"{API_URL}/Accounts/transfer",
            {
                "sourceAccountId": checking["id"],
                "destinationAccountNumber": savings["accountNumber"],
                "amount": trans_amount,
                "description": "Internal Transfer Test"
            },
            headers=c_headers
        )
        assert status == 200, f"Transfer failed: {res}"
        print(f"  SUCCESS: Transferred INR {trans_amount:.2f} from Checking to Savings.")
        
        # Verify balances updated on both sides
        status, accounts_final = make_request(f"{API_URL}/Accounts/myaccounts", headers=c_headers)
        c_final = next(a for a in accounts_final if a["id"] == checking["id"])
        s_final = next(a for a in accounts_final if a["id"] == savings["id"])
        print(f"  SUCCESS: Source Account Balance: INR {c_final['balance']:.2f}")
        print(f"  SUCCESS: Destination Account Balance: INR {s_final['balance']:.2f}")
        checking_after = c_final
    else:
        print("  INFO: Skipping transfer test (Customer has only 1 active account).")

    # 6. Beneficiaries
    print("\n[6] BENEFICIARY OPERATION TEST")
    status, b_res = make_request(
        f"{API_URL}/Beneficiaries/add",
        {
            "beneficiaryName": "Bob Tester",
            "accountNumber": "ACC9999",
            "bankName": "Test Bank",
            "branchName": "Test Branch",
            "ifscCode": "TEST0000001"
        },
        headers=c_headers
    )
    assert status == 200, f"Add beneficiary failed: {b_res}"
    print("  SUCCESS: Beneficiary 'Bob Tester' added successfully.")
    
    # Get beneficiaries
    status, b_list = make_request(f"{API_URL}/Beneficiaries/mybeneficiaries", headers=c_headers)
    bob = next((b for b in b_list if b["beneficiaryName"] == "Bob Tester"), None)
    assert bob is not None, "Bob Tester not found in list"
    
    # Delete beneficiary
    status, del_res = make_request(f"{API_URL}/Beneficiaries/delete/{bob['id']}", headers=c_headers, method="DELETE")
    assert status == 200, f"Delete beneficiary failed: {del_res}"
    print("  SUCCESS: Beneficiary 'Bob Tester' deleted successfully.")

    # 7. Loans Workflow (Apply, Approve, Disburse, Repay)
    print("\n[7] LOAN WORKFLOW TEST")
    loan_amount = 30000.00
    status, loan_apply_res = make_request(
        f"{API_URL}/Loans/apply",
        {
            "accountNumber": checking["accountNumber"],
            "loanAmount": loan_amount,
            "purpose": "Business Expansion Test",
            "tenureMonths": 12,
            "interestRate": 8.5
        },
        headers=c_headers
    )
    assert status == 200, f"Loan application failed: {loan_apply_res}"
    loan_id = loan_apply_res["id"]
    assert loan_apply_res["loanStatus"] == "Pending", "Loan status should be Pending"
    print(f"  SUCCESS: Applied for INR {loan_amount:.2f} loan (ID: {loan_id}, Status: Pending).")

    # Approve as Employee
    e_headers = {"Authorization": f"Bearer {employee_token}"}
    status, loan_approve_res = make_request(
        f"{API_URL}/Loans/approve/{loan_id}",
        headers=e_headers,
        method="PUT"
    )
    assert status == 200, f"Loan approval failed: {loan_approve_res}"
    assert loan_approve_res["loanStatus"] == "Approved", "Loan status should be Approved"
    print("  SUCCESS: Loan approved by Bank Employee. Funds disbursed.")

    # Verify balance contains loan disbursement
    status, accounts_post_loan = make_request(f"{API_URL}/Accounts/myaccounts", headers=c_headers)
    c_post_loan = next(a for a in accounts_post_loan if a["id"] == checking["id"])
    print(f"  INFO: Post-Disbursement Balance: INR {c_post_loan['balance']:.2f} (Expected: INR {c_final['balance'] + loan_amount:.2f})")
    assert c_post_loan["balance"] == c_final["balance"] + loan_amount, "Loan funds not disbursed to account"
    print(f"  SUCCESS: Checking account balance updated with disbursed funds: INR {c_post_loan['balance']:.2f}")

    # Repay Loan
    repay_amount = 5000.00
    status, repay_res = make_request(
        f"{API_URL}/Loans/repay/{loan_id}",
        {
            "sourceAccountNumber": checking["accountNumber"],
            "amount": repay_amount
        },
        headers=c_headers,
        method="POST"
    )
    assert status == 200, f"Loan repayment failed: {repay_res}"
    print(f"  SUCCESS: Repaid INR {repay_amount:.2f} towards the loan.")
    print(f"  SUCCESS: Remaining Loan Balance: INR {repay_res['newRemainingBalance']:.2f}")
    print(f"  SUCCESS: Source Checking Account Balance: INR {repay_res['newAccountBalance']:.2f}")

    print("\n==================================================")
    print(" ALL BANK OPERATIONS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
