import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage';
import NavBar from './components/NavBar'
import './App.css'
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage'
import StockPage from './pages/StocksPage';
import BudgetPage from './pages/BudgetPage';
import NewsPage from './pages/NewsPage';
import Chatbot from './components/Chatbot';
import { AuthProvider } from "./hooks/AuthContext";
import LearningCenter from './pages/LearningcenterPage';
import CareerPath from './pages/CareerPath';
import PaperTradingPage from './pages/PaperTradingPage';
import PaperTradeOrderPage from './pages/PaperTradeOrderPage';



function App() {
  return (
     <AuthProvider>
    <Router>
      <NavBar/>
      <Chatbot/>
      <div className="main-content">
      <Routes>
        <Route path="/" element= {<HomePage/>} />
        <Route path="/home" element= {<HomePage/>} />
        <Route path="/login" element={<LoginPage/>}/>
        <Route path="/signup" element={<SignupPage/>}/>
        <Route path="/stocks" element={<StockPage/>}/>
        <Route path="/budget" element={<BudgetPage/>}/>
        <Route path="/news" element={<NewsPage/>}/>
        <Route path="/learningCenter" element={<LearningCenter/>}/>
        <Route path="/career" element={<CareerPath/>}/>
        <Route path="/papertrade" element={<PaperTradingPage/>}/>
        <Route path="/papertrade/order/:symbol" element={<PaperTradeOrderPage/>}/>
      </Routes>
      </div>
    </Router>
    </AuthProvider>
  );
}

export default App
