import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Label } from './ui/label'
import { ThemeToggle } from './ui/theme-toggle'

function LoginPage() {
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
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-green-700 dark:text-green-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="border-green-200 focus:border-green-500 dark:border-green-800 dark:bg-neutral-900 dark:text-green-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-green-700 dark:text-green-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="border-green-200 focus:border-green-500 dark:border-green-800 dark:bg-neutral-900 dark:text-green-100"
              />
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                Forgot password?
              </a>
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600">
              Login
            </Button>

            <p className="text-sm text-center text-green-600 dark:text-green-400">
              Don't have an account?{" "}
              <a href="/signup" className="text-green-700 hover:underline font-medium dark:text-green-300">
                Sign up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage