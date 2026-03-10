import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';

const BLANK_FIELD_MSG = 'please fill out this field';

// Frontend validation - returns field-level errors
function validateSignupForm(data: {
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  department: string;
  phone: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.username?.trim()) errors.username = BLANK_FIELD_MSG;
  else if (data.username.trim().length < 3) errors.username = 'username must be greater than or equal to 3 characters';

  if (!data.name?.trim()) errors.name = BLANK_FIELD_MSG;

  if (!data.email?.trim()) errors.email = BLANK_FIELD_MSG;
  else if (!data.email.toLowerCase().endsWith('@tce.edu') && !data.email.toLowerCase().endsWith('@student.tce.edu')) errors.email = 'Only TCE college email addresses (@tce.edu or @student.tce.edu) are allowed to register';

  if (!data.password) errors.password = BLANK_FIELD_MSG;
  else if (data.password.length < 8) errors.password = 'password must contain 8 characters long (having combination of alphanumeric)';
  else if (!/^(?=.*[a-zA-Z])(?=.*[0-9])/.test(data.password)) errors.password = 'password must contain 8 characters long (having combination of alphanumeric)';

  if (!data.confirmPassword) errors.confirmPassword = BLANK_FIELD_MSG;
  else if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords do not match';

  if (!data.role?.trim()) errors.role = BLANK_FIELD_MSG;

  if (!data.department?.trim()) errors.department = BLANK_FIELD_MSG;

  if (!data.phone?.trim()) errors.phone = BLANK_FIELD_MSG;
  else if (!/^\d{10}$/.test(data.phone.replace(/\s/g, ''))) errors.phone = 'phone number must contain 10 digits';

  return errors;
}

function validateLoginForm(data: { email: string; password: string; role: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.email?.trim()) errors.email = BLANK_FIELD_MSG;
  else if (!data.email.toLowerCase().endsWith('@tce.edu') && !data.email.toLowerCase().endsWith('@student.tce.edu')) errors.email = 'Only TCE college faculty/students (@tce.edu or @student.tce.edu) can login';
  if (!data.password) errors.password = BLANK_FIELD_MSG;
  if (!data.role?.trim()) errors.role = BLANK_FIELD_MSG;
  return errors;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'admin' | 'faculty' | 'hod' | ''>('faculty');
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [signupRole, setSignupRole] = useState<'admin' | 'faculty' | 'hod' | ''>('faculty');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const clearErrors = () => {
    setError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!isSignup) {
      const loginErrors = validateLoginForm({ email, password, role });
      if (Object.keys(loginErrors).length > 0) {
        setFieldErrors(loginErrors);
        setError(Object.values(loginErrors)[0] || 'Please fill in all fields');
        return;
      }

      try {
        const successResult = await login(email, password, role as 'admin' | 'faculty' | 'hod');
        if (successResult) {
          if (role === 'admin') navigate('/admin');
          else if (role === 'hod') navigate('/hod');
          else navigate('/faculty');
        } else {
          setError('Invalid credentials. Please try again.');
        }
      } catch (err: unknown) {
        const errObj = err as Error & { fieldErrors?: Record<string, string> };
        if (errObj.fieldErrors) {
          setFieldErrors(errObj.fieldErrors);
        }
        setError(errObj.message || 'Login failed. Please try again.');
        console.error('Login error:', err);
      }
      return;
    }

    // Signup validation
    const signupErrors = validateSignupForm({
      username,
      name,
      email,
      password,
      confirmPassword,
      role: signupRole,
      department,
      phone,
    });

    if (Object.keys(signupErrors).length > 0) {
      setFieldErrors(signupErrors);
      setError(Object.values(signupErrors)[0] || 'Please fill in all fields');
      return;
    }

    try {
      await authAPI.register({
        username: username.trim(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: signupRole,
        department: department.trim(),
        phone: phone.replace(/\s/g, ''),
      });

      setSuccess('Registration successful! Please login with your credentials.');
      setIsSignup(false);
      setEmail('');
      setPassword('');
      setUsername('');
      setName('');
      setPhone('');
      setDepartment('');
      setConfirmPassword('');
      setFieldErrors({});

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: unknown) {
      const errObj = err as Error & { fieldErrors?: Record<string, string> };
      if (errObj.fieldErrors) {
        setFieldErrors(errObj.fieldErrors);
      }
      setError(errObj.message || 'Sign up failed. Please try again.');
      console.error('Signup error:', err);
    }
  };

  const getFieldError = (field: string) => fieldErrors[field];
  const hasFieldError = (field: string) => !!fieldErrors[field];

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    if (!forgotEmail?.trim()) {
      setForgotError('please fill out this field');
      return;
    }
    if (!forgotEmail.toLowerCase().endsWith('@tce.edu') && !forgotEmail.toLowerCase().endsWith('@student.tce.edu')) {
      setForgotError('Only TCE college email addresses (@tce.edu or @student.tce.edu) are allowed');
      return;
    }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail.trim().toLowerCase());
      setForgotSuccess('Password reset link has been sent to your email. Please check your inbox.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotSuccess('');
      }, 3000);
    } catch (err: unknown) {
      setForgotError((err as Error).message || 'Failed to send reset link');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{isSignup ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSignup ? 'Sign up to access your facility portfolio (TCE users only)' : 'Sign in to access your faculty portfolio'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username (min 3 characters)"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearErrors(); }}
                  className={hasFieldError('username') ? 'border-destructive' : ''}
                  aria-invalid={hasFieldError('username')}
                  aria-describedby={hasFieldError('username') ? 'username-error' : undefined}
                />
                {hasFieldError('username') && (
                  <p id="username-error" className="text-sm text-destructive">{getFieldError('username')}</p>
                )}
              </div>
            )}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErrors(); }}
                  className={hasFieldError('name') ? 'border-destructive' : ''}
                  aria-invalid={hasFieldError('name')}
                />
                {hasFieldError('name') && <p className="text-sm text-destructive">{getFieldError('name')}</p>}
              </div>
            )}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={signupRole} onValueChange={(v) => { setSignupRole(v as 'admin' | 'faculty' | 'hod'); clearErrors(); }}>
                  <SelectTrigger id="role" className={hasFieldError('role') ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                  </SelectContent>
                </Select>
                {hasFieldError('role') && <p className="text-sm text-destructive">{getFieldError('role')}</p>}
              </div>
            )}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="Enter your department"
                  value={department}
                  onChange={(e) => { setDepartment(e.target.value); clearErrors(); }}
                  className={hasFieldError('department') ? 'border-destructive' : ''}
                />
                {hasFieldError('department') && <p className="text-sm text-destructive">{getFieldError('department')}</p>}
              </div>
            )}
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearErrors(); }}
                  maxLength={10}
                  className={hasFieldError('phone') ? 'border-destructive' : ''}
                />
                {hasFieldError('phone') && <p className="text-sm text-destructive">{getFieldError('phone')}</p>}
              </div>
            )}
            {!isSignup && (
              <div className="space-y-2">
                <Label htmlFor="loginRole">Role</Label>
                <Select value={role} onValueChange={(v) => { setRole(v as 'admin' | 'faculty' | 'hod'); clearErrors(); }}>
                  <SelectTrigger id="loginRole" className={hasFieldError('role') ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                  </SelectContent>
                </Select>
                {hasFieldError('role') && <p className="text-sm text-destructive">{getFieldError('role')}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={isSignup ? "your.name@student.tce.edu" : "Enter your email"}
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
                className={hasFieldError('email') ? 'border-destructive' : ''}
              />
              {hasFieldError('email') && <p className="text-sm text-destructive">{getFieldError('email')}</p>}
              {isSignup && <p className="text-xs text-muted-foreground">Only @tce.edu or @student.tce.edu emails allowed</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                  className={`pr-10 ${hasFieldError('password') ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isSignup && (
                <p className="text-xs text-muted-foreground mt-1">
                  Must be 8 characters with letters and numbers
                </p>
              )}
              {hasFieldError('password') && <p className="text-sm text-destructive">{getFieldError('password')}</p>}
              {!isSignup && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }}
                    className={`pr-10 ${hasFieldError('confirmPassword') ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {hasFieldError('confirmPassword') && <p className="text-sm text-destructive">{getFieldError('confirmPassword')}</p>}
              </div>
            )}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 p-3 rounded-md border border-green-200 dark:border-green-800">
                {success}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              {isSignup ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                clearErrors();
                setIsSignup((v) => !v);
              }}
            >
              {isSignup ? 'Already have an account? Sign in' : 'New user? Create an account'}
            </button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              Enter your TCE email address and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Email</Label>
              <Input
                id="forgotEmail"
                type="email"
                placeholder="your.name@student.tce.edu"
                value={forgotEmail}
                onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
              />
            </div>
            {forgotError && <p className="text-sm text-destructive">{forgotError}</p>}
            {forgotSuccess && <p className="text-sm text-green-600 dark:text-green-400">{forgotSuccess}</p>}
            <Button type="submit" className="w-full" disabled={forgotLoading}>
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Login;
