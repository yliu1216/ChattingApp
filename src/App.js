import './App.css';
import {Route, Routes} from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Chat from './components/chat';
import axios from 'axios';
import { UserContextProvider } from './components/UserContext';




function App() {
  axios.defaults.baseURL = 'http://localhost:4040';
  axios.defaults.withCredentials =true;

  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/chat" element={<Chat/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
      </Routes>
    </UserContextProvider>
  );
}

export default App;
