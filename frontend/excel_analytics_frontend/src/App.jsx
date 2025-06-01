import React from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

function App() {
  return (
    <div className='flex flex-col  items-center justify-center'>
        <h1>Welcome to the Excel Analytics Platform</h1>
        <h2>Signup</h2>
        <Input type="username" placeholder="Username"/>
        <Input type="email" placeholder="Email"/>
        <Input type="password" placeholder="Password"/>
       <Button>Signup</Button> 
    </div>
  )
}

export default App
