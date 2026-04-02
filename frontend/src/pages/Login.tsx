import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data, data.token);
      navigate('/');
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Address Navigation System</h1>
        <p style={subtitleStyle}>Log in to manage saved addresses and start navigation.</p>

        <label style={labelStyle}>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="Enter your password"
            style={inputStyle}
          />
        </label>

        {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}

        <button type="submit" disabled={loading} style={primaryButtonStyle}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p style={{ marginBottom: 0 }}>
          Don't have an account? <Link to="/register">Register now</Link>
        </p>
      </form>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #edf4ff 0%, #f7f9fc 100%)',
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: 420,
  background: '#ffffff',
  borderRadius: 20,
  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 8,
  color: '#475569',
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#0f172a',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 14,
  outline: 'none',
};

const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 12,
  padding: '12px 16px',
  background: '#0f172a',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#991b1b',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
};

export default Login;
