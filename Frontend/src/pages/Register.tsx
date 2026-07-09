import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pwStrength, setPwStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  const API = 'https://localhost:7174/api';

  const handleDobChange = (dobString: string) => {
    setDateOfBirth(dobString);
    if (!dobString) {
      setAge(null);
      return;
    }
    const dob = new Date(dobString);
    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
    setAge(calculatedAge);
  };

  const handlePasswordChange = (pw: string) => {
    setPassword(pw);
    if (!pw) {
      setPwStrength('weak');
      return;
    }
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pw);
    const isLong = pw.length >= 8;
    const score = [hasUpper, hasNumber, hasSpecial, isLong].filter(Boolean).length;
    
    if (score <= 2) {
      setPwStrength('weak');
    } else if (score === 3) {
      setPwStrength('medium');
    } else {
      setPwStrength('strong');
    }
  };

  const extractErrorMessage = (errData: any): string => {
    if (errData) {
      if (typeof errData === 'object') {
        if (errData.errors) {
          const messages = [];
          for (const key in errData.errors) {
            if (Object.prototype.hasOwnProperty.call(errData.errors, key)) {
              messages.push(...errData.errors[key]);
            }
          }
          return messages.join(' ');
        }
        if (errData.message) {
          return errData.message;
        }
        return JSON.stringify(errData);
      }
      return errData;
    }
    return '';
  };

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !fullName ||
      !email ||
      !password ||
      !phoneNumber ||
      !address ||
      !gender ||
      !dateOfBirth ||
      !aadharNumber ||
      !panNumber
    ) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (aadharNumber.length !== 12 || isNaN(Number(aadharNumber))) {
      setErrorMessage('Aadhar Number must be exactly 12 digits.');
      return;
    }

    if (panNumber.length !== 10) {
      setErrorMessage('PAN Number must be exactly 10 characters.');
      return;
    }

    if (age !== null && age < 18) {
      setErrorMessage('You must be at least 18 years old to register.');
      return;
    }

    setIsLoading(true);
    const body = {
      fullName,
      email,
      password,
      phoneNumber,
      address,
      role: 'Customer',
      gender,
      dateOfBirth,
      aadharNumber,
      panNumber: panNumber.toUpperCase(),
    };

    try {
      const res = await fetch(`${API}/Users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errContent;
        try {
          errContent = await res.json();
        } catch {
          errContent = await res.text();
        }
        throw new Error(extractErrorMessage(errContent) || 'An error occurred during registration.');
      }

      setIsLoading(false);
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'An error occurred during registration.');
    }
  };

  return (
    <div className="auth-bg" style={{ padding: '40px 24px' }}>
      <div className="auth-card animate-in" style={{ maxWidth: '560px' }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <i className="bi bi-bank2"></i>
          </div>
        </div>
        <div className="text-center mb-2">
          <h1 className="auth-title">Create Account</h1>
        </div>
        <p className="auth-subtitle">Join Maverick Bank – fill in your details below</p>

        {/* Alerts */}
        {errorMessage && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-circle-fill"></i> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success">
            <i className="bi bi-check-circle-fill"></i> {successMessage}
          </div>
        )}

        {/* Row 1: Full Name + Gender */}
        <div className="row g-3 mb-0">
          <div className="col-md-7">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-group-icon">
                <i className="bi bi-person icon"></i>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="col-md-5">
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div className="input-group-icon">
            <i className="bi bi-envelope icon"></i>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">Password</label>
          <div className="input-group-icon">
            <i className="bi bi-lock icon"></i>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              placeholder="Create a password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              style={{ paddingRight: '44px' }}
            />
            <i
              className={`bi icon ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
              style={{ right: '14px', left: 'auto', cursor: 'pointer' }}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>
          {password && (
            <div className="pw-strength-bar">
              <div
                className={`pw-strength-fill ${
                  pwStrength === 'weak' ? 'pw-weak' : pwStrength === 'medium' ? 'pw-medium' : 'pw-strong'
                }`}
              ></div>
            </div>
          )}
          <small style={{ fontSize: '11px', color: 'var(--dark-text-dim)' }}>
            Minimum 8 chars, include uppercase, number & special character
          </small>
        </div>

        {/* Phone + DOB */}
        <div className="row g-3">
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-group-icon">
                <i className="bi bi-telephone icon"></i>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="10-digit mobile"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control"
                value={dateOfBirth}
                onChange={(e) => handleDobChange(e.target.value)}
              />
              {age !== null && (
                <small style={{ fontSize: '12px', color: 'var(--success)' }}>
                  Age: {age} years
                </small>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="form-group">
          <label className="form-label">Address</label>
          <div className="input-group-icon">
            <i className="bi bi-geo-alt icon"></i>
            <input
              type="text"
              className="form-control"
              placeholder="Enter full address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        {/* Aadhar + PAN */}
        <div className="row g-3">
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">Aadhar Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="12-digit Aadhar"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                maxLength={12}
              />
              <small style={{ fontSize: '11px', color: 'var(--dark-text-dim)' }}>Exactly 12 digits</small>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                maxLength={10}
                style={{ textTransform: 'uppercase' }}
              />
              <small style={{ fontSize: '11px', color: 'var(--dark-text-dim)' }}>10-character PAN</small>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="button"
          className="btn btn-primary btn-full mt-2"
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading && <span className="spinner"></span>}
          {!isLoading && <i className="bi bi-person-plus"></i>}
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="divider"></div>
        <p className="text-center" style={{ fontSize: '13px', color: 'var(--dark-text-dim)' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-primary" style={{ fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
