import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import NavBar from './components/NavBar'

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage'
import StockPage from './pages/StocksPage';

function App() {
  return (
    <Router>
      <NavBar/>
      <div class="main-content">
      <Routes>
        <Route path="/home" element= {<HomePage/>} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/stocks" element={<StockPage/>}/>
      </Routes>
      </div>
    </Router>
  );

  // const [count, setCount] = useState(0)

  // const [message, setMessage] = useState("")

  // const fetchMessage = async () => {
  //   const response = await fetch("/api/hello")
  //   const data = await response.json()
  //   setMessage(data.message)
  // }

  // return (
  //   <>
  //     <div>
  //       <a href="https://vite.dev" target="_blank">
  //         <img src={viteLogo} className="logo" alt="Vite logo" />
  //       </a>
  //       <a href="https://react.dev" target="_blank">
  //         <img src={reactLogo} className="logo react" alt="React logo" />
  //       </a>
  //     </div>
  //     <h1>Vite + React</h1>
  //     <div className="card">
  //       <button onClick={() => setCount((count) => count + 1)}>
  //         count is {count}
  //       </button>
  //       <p>
  //         Edit <code>src/App.jsx</code> and save to test HMR
  //       </p>
  //     </div>
  //     <p className="read-the-docs">
  //       Click on the Vite and React logos to learn more
  //     </p>
  //     <button onClick={fetchMessage}>Fetch Message</button>
  //     <p>Message from API: {message}</p>
  //   </>
  // )
}

export default App
