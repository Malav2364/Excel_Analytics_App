import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactDOM from "react-dom/client"
import { ThemeProvider } from './components/theme-provider'
import Dashboard from './components/Dashboard'
import './index.css'
import App from './App.jsx'
import SignupPage from './components/Signup_page'
import LoginPage from './components/Login'
import PrivateRoute from './components/PrivateRoute'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <Routes>
            <Route path='/' element={<App/>}/>
            <Route path='/signup' element={<SignupPage/>}/>
            <Route path='/login' element={<LoginPage/>}/>
            <Route 
              path='/dashboard' 
              element={
                <PrivateRoute>
                  <Dashboard/>
                </PrivateRoute>
              }/>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
