import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from './UserContext';
import axios from 'axios';
import { Navigate, Link } from 'react-router-dom';

export default function Register() {
  const [headingText, setHeadingText] = useState("Register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUserName: setLoggedInUsername, setId } = useContext(UserContext);
  const [redirect, setRedirect] = useState(false);

  const [isMouseOver, setIsMouseOver] = useState(false);

  function handleMouseOver() {
    setIsMouseOver(true);
  }

  function handleMouseOut() {
    setIsMouseOver(false);
  }

  async function register(event) {
    event.preventDefault();
    try {
      const { data } = await axios.post("/register", { username, email, password });
      setLoggedInUsername(username);
      setId(data._id);
      alert("Registration successful! You can now log in.");
      setRedirect(true);
    } catch (err) {
      console.log(`Something went wrong: ${err}`);
    }
  }

  useEffect(() => {
    if (redirect) {
      // Redirect to the login page
      setRedirect(false);
    }
  }, [redirect]);

  if (redirect) {
    return <Navigate to="/login" />;
  }
  return (
    <div className="bg-blue-25 h-screen items-center">
      <h1 className="text-4xl text-center mb-4 text-blue font-bold">{headingText}</h1>
      <form className="max-w-md mx-auto" onSubmit={register}>
        <input onChange={event => setUsername(event.target.value)} type="text" name="username" placeholder="Enter username" value={username} />
        <input type="email" value={email} onChange={event => setEmail(event.target.value)} name="email" placeholder="Enter your email" /><br />
        <input type="password" value={password} onChange={event => setPassword(event.target.value)} name="password" placeholder="Enter Password" /><br />
        <button className="bg-red p-2 w-full text-white rounded-2xl" style={{ backgroundColor: isMouseOver ? "#ef4444" : "#139EFA" }} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Register</button>
        <div className="text-center py-2 text-gray-500"> Already have an account? <Link className="underline text-black" to={'/Login'}>Login now</Link></div>
      </form>
    </div>
  );
}