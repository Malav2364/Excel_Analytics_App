import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Label } from './ui/label'
import { ThemeToggle } from './ui/theme-toggle'
import authService from '../services/authService'

function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
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
      await authService.register(formData.username, formData.email, formData.password);
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
              Create Account
            </CardTitle>
            <ThemeToggle />
          </div>
          <CardDescription className="text-green-600 dark:text-green-400">
            Sign up to analyze and visualize your Excel data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded bg-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-green-700 dark:text-green-300">
                Username
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="border-green-200 focus:border-green-500 dark:border-green-800 dark:bg-neutral-900 dark:text-green-100"
                required
              />
            </div>
            
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
                className="border-green-200 focus:border-green-500 dark:border-green-800 dark:bg-neutral-900 dark:text-green-100"
                required
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
                placeholder="Create a password (min. 6 characters)"
                className="border-green-200 focus:border-green-500 dark:border-green-800 dark:bg-neutral-900 dark:text-green-100"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <p className="text-sm text-center text-green-600 dark:text-green-400">
              Already have an account?{" "}
              <a href="/login" className="text-green-700 hover:underline font-medium dark:text-green-300">
                Login
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignupPage