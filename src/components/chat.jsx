import { React, useEffect, useState, useContext, useRef } from 'react';
import Avatar from './Avatar';
import Logo from './Logo';
import { UserContext } from './UserContext';
import { uniqBy } from 'lodash';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Chat() {
  const [ws, setWS] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState([]);
  const [offlinePeople, setOfflinePeople] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { username, id, setId, setUserName } = useContext(UserContext);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const divUnderMessage = useRef();
  const[isMouseOver, setIsMouseOver] = useState(false);
  const[isMouseOver1, setIsMouseOver1] = useState(false);
  const navigate = useNavigate();

function handleMouseOver(){
    setIsMouseOver(true);
}

function handleMouseOut(){
   setIsMouseOver(false);
}

function handleMouseOver1(){
  setIsMouseOver1(true);
}

function handleMouseOut1(){
 setIsMouseOver1(false);
}

function logout(){
  axios.post("/logout").then(()=>{
    setId(null);
    setUserName(null);
    axios.defaults.headers.common['Authorization'] = '';
    localStorage.removeItem('token');
     navigate("/login");
  })
}

  useEffect(() => {
    let wsConnection = new WebSocket('ws://localhost:4040');
    setWS(wsConnection);
    wsConnection.addEventListener('message', handleMessage);

     // Set the authentication token header
  const token = localStorage.getItem('token');
  axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';

    return () => {
      wsConnection.removeEventListener('message', handleMessage);
      wsConnection.close();
    };
  }, []);

  function showOnlinePeople(peopleArray) {
    const people = peopleArray.filter(({ userId }) => userId !== id);
    setOnlinePeople(people);
  }

  function handleMessage(ev) {
   
    const messageData = JSON.parse(ev.data);
    if ('online' in messageData) {
      showOnlinePeople(messageData.online);
    } else{
      const newMessage = {
        sender: messageData.sender,
        recipient: messageData.recipient,
        isOur: false,
        text: messageData.text,
        file:messageData.file,
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
    }
  }

  function handleSelectedUser(userId) {
    setSelectedUserId(userId);
  }

  function sendMessage(ev, file=null) {
    if(ev)ev.preventDefault();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket connection is not open.');
      return;
    }
    console.log('sending');
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessage,
        file,
      }));
      setNewMessage('');
      setMessages(prev => [...prev, { text: newMessage, sender: id, isOur: true }]);
    if(file){
      axios.get('/messages/' + selectedUserId).then(res => {
        setMessages(res.data);
      });
    }  }


  function sendFile(ev){
    
    const reader  = new FileReader();
    console.log(ev.target.files[0])
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () =>{
      sendMessage(null, {
        name:ev.target.files[0].name,
        data:reader.result
      });
    }

  }

  useEffect(() => {
    const div = divUnderMessage.current;
    if (div) {
      div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  useEffect(() => {
    axios.get('/people').then(res => {
      const offlinePeopleArray = res.data
        .filter(p => p._id !== id)
        .filter(p => !onlinePeople.find(onlinePerson => onlinePerson.userId === p._id));
      setOfflinePeople(offlinePeopleArray);
    });
  }, [onlinePeople, id]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get('/messages/' + selectedUserId).then(res => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const onlinePeopleExclOurUser = onlinePeople.filter(user => user.userId !== id);

  const messagesWithoutDupes = messages.filter(
    (message, index, self) =>
      index ===
      self.findIndex(
        m =>
          m.sender === message.sender &&
          m.recipient === message.recipient &&
          m.text === message.text &&
          m.file === message.file
      )
  );

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <Logo />
        <div className="flex-grow">
          {onlinePeopleExclOurUser.length > 0 ? (
            <>
              <h3 className="font-bold mb-2">Online People</h3>
              {onlinePeopleExclOurUser.map(user => (
                <div
                  key={user.userId}
                  onClick={() => handleSelectedUser(user.userId)}
                  className={`flex gap-2 items-center border-b border-gray-100 pl-4 py-2 text-black cursor-pointer ${
                    user.userId === selectedUserId ? 'bg-blue-50' : ''
                  }`}
                >
                  {user.userId === selectedUserId && (
                    <div className="w-1 bg-blue h-12 rounded-r-md"></div>
                  )}
                  <Avatar username={user.username} userId={user.userId} online={onlinePeople} />
                  <span className="text-lime">{user.username}</span>
                </div>
              ))}
            </>
          ) : (
            <div>No online users</div>
          )}
        </div>
        <div className="flex-grow">
          {offlinePeople.length > 0 ? (
            <>
              <h3 className="font-bold mb-2">Offline People</h3>
              {offlinePeople.map(user => (
                <div
                  key={user._id}
                  onClick={() => handleSelectedUser(user._id)}
                  className={`flex gap-2 items-center border-b border-gray-100 pl-4 py-2 text-black cursor-pointer ${
                    user._id === selectedUserId ? 'bg-blue-50' : ''
                  }`}
                >
                  {user._id === selectedUserId && (
                    <div className="w-1 bg-blue h-12 rounded-r-md"></div>
                  )}
                  <Avatar username={user.username} userId={user._id} online={!onlinePeople} />
                  <span className="text-lime">{user.username}</span>
                </div>
              ))}
            </>
          ) : (
            <div>No offline users</div>
          )}
        </div>
        <div className="p-2 text-center gap-2 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-blue">
           <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>

          <span className="font-bold text-blue mr-2 items-center">  Welcome {username} <br />  </span>
          <button onClick={logout} className="font-bold text-sm bg-primary p-2 text-white rounded-full"  style={{backgroundColor:isMouseOver? "#f87171": "#139EFA"}} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>Log Out</button>
        </div>
      </div>

      <div className="flex flex-col bg-blue-25 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex flex-grow h-full items-center justify-center">
              <div className="text-gray-100">&larr; Select a user from the list</div>
            </div>
          )}

          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">

                {messagesWithoutDupes.map((message, index) => (
                  <div className={message.sender === id ? 'text-right' : 'text-left'} key={index}>
                    <div
                      className={`text-left inline-block p-2 my-2 rounded-full text-sm ${
                        message.sender === id ? 'bg-blue text-white' : 'bg-white text-'
                      }`}
                    > 
                      {message.text}
                      {message.file &&(
                        <div className="">
                          <a target='_blank' className="flex items-center gap-1 border-b underline" href={axios.defaults.baseURL + '/uploads/' + message.file }>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                           </svg>
                           { message.file }
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessage}></div>
              </div>
            </div>
          )}
        </div>

        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              value={newMessage}
              onChange={ev => setNewMessage(ev.target.value)}
              type="text"
              className="bg-white border flex p-2 arouned-xl border-gray-300"
              placeholder="Type your messages here"
            ></input>

            <label className='bg-gray-300 p-2 text-white rounded-full cursor-pointer border-gray-300'>
              <input type="file" className="hidden" onChange={sendFile} />
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
               </svg>
            </label>

            <button className="bg-blue p-2 text-white rounded-full"  style={{backgroundColor:isMouseOver1? "#00A300": "#139EFA"}} onMouseOver={handleMouseOver1} onMouseOut={handleMouseOut1}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}