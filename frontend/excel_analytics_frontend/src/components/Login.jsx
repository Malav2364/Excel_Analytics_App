import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from './ui/input'
import { Button } from './ui/button'
import authService from '../services/authService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Label } from './ui/label'
import { ThemeToggle } from './ui/theme-toggle'

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(formData.email, formData.password);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-black dark:to-neutral-900">
      <Card className="w-[400px] shadow-xl dark:bg-black dark:border-green-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-400">
              Welcome Back
            </CardTitle>
            <ThemeToggle />
          </div>
          <CardDescription className="text-green-600 dark:text-green-400">
            Login to access your Excel analytics dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-green-600 dark:text-green-400 mb-4">
              Welcome to Excel Analytics. Please log in with your account credentials.
            </p>
            {error && (
              <div className="p-3 rounded bg-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-700 dark:text-green-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className="border-green-200 focus:border-green-500 dark:border-green-800 dark:focus:border-green-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-green-700 dark:text-green-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="border-green-200 focus:border-green-500 dark:border-green-800 dark:focus:border-green-600"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm text-green-600 dark:text-green-400">
              Don't have an account?{' '}
              <a
                href="/signup"
                className="text-green-700 dark:text-green-300 hover:underline"
              >
                Sign up
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;