import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Component/Login';
import Signup from './Component/Signup';
import DashboardLayoutBasic from './Component/tolpad';
function App() {
 
  return (

    <Router>
      <div className="App">
        <Routes>
          
        <Route path="/login" element={<Login />} />
           <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/tolpad" element={<DashboardLayoutBasic />} />




        </Routes>
        
      </div>
    </Router>
  );
}

export default App;
