import React, { useContext, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [headingText, setHeadingText] = useState('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);

  const [isMouseOver, setIsMouseOver] = useState(false);

  async function handleSumbit(event) {
    event.preventDefault();
    try {
      const response = await axios.post('/login', { email, password });
      const { data } = response;
      console.log(data);
      alert('Login successful');
      localStorage.setItem('token', data.token);
      setRedirect(true);
    } catch (err) {
      console.error(err);
      alert('Something went wrong');
    }
  }

  useEffect(() => {
    if (redirect) {
      setRedirect(false);
    }
  }, [redirect]);

  if (redirect) {
    return <Navigate to="/chat" />;
  }

  return (
    <div className="bg-blue-25 h-screen">
      <h1 className="text-4xl text-blue font-bold text-center mb-4">{headingText}</h1>
      <form className="max-w-md mx-auto" onSubmit={handleSumbit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          name="email"
          placeholder="your@email.com"
        />
        <br />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          name="password"
          placeholder="Enter Password"
        />
        <br />
        <button
          className="text-white p-2 w-full rounded-2xl"
          style={{ backgroundColor: isMouseOver ? '#22c55e' : '#139EFA' }}
          onMouseOver={() => setIsMouseOver(true)}
          onMouseOut={() => setIsMouseOver(false)}
        >
          Login
        </button>
        <div className="text-center py-2 text-gray-500">
          Don't have an account yet?{' '}
          <Link className="underline text-black" to="/register">
            Register now
          </Link>
        </div>
      </form>
    </div>
  );
}