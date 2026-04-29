import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useLoginMutation } from '../../store/api/authApi.js';
import { setCredentials, deriveMenuPermissions } from '../../store/authSlice.js';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = 'Username is required';
    if (!password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setServerError('');

    try {
      const result = await login({ username, password }).unwrap();
      dispatch(setCredentials({
        token: result.access,
        refreshToken: result.refresh,
        user: result.user,
        menuPermissions: deriveMenuPermissions(result.user),
      }));
      navigate(from, { replace: true });
    } catch (err) {
      const detail = err?.data?.detail || err?.data?.non_field_errors?.[0] || 'Invalid credentials. Please try again.';
      setServerError(detail);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0F1F3D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(26,68,128,0.4) 0%, transparent 60%)',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 440, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box component="img" src="/psc.png" alt="KPSC Logo" sx={{ height: 80, mb: 1.5 }} />
            <Typography variant="h2" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
              Kerala Public Service Commission
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              Sitting Management System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={!!errors.username}
              helperText={errors.username}
              sx={{ mb: 2 }}
              autoComplete="username"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 3 }}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{ height: 48 }}
            >
              {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
