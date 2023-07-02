const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const ws = require('ws');
const fs = require('fs');
require('dotenv').config();

const bcryptSalt =  bcrypt.genSaltSync(12);

mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("connnected to database");
}).catch(err => console.log(err));

const jwtSecret = process.env.JWT_SECRET;


app.use(express.json());
app.use('/uploads', express.static(__dirname+'/uploads'));
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: ['http://192.168.56.1:3000', 'http://localhost:3000', 'http://localhost:3001'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Credentials'],
}));


async function getUserDataFromRequest(req){
    return new Promise((resolve, reject) =>{
      const token = req.cookies?.token;
      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if(err) throw err;
            resolve(userData);
        })
    }else{
        reject('no token provided');
    }
    });
}



app.post('/', (req, res) => {
    console.log("connected house");
    res.json('home');
})


app.get('/messages/:userId', async(req, res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages= await Message.find({
        sender:{$in:[userId, ourUserId]},
        recipient:{$in:[userId, ourUserId]},
    }).sort({createdAt:1}).catch(err=>{console.log(err)});
    res.json(messages);
});


app.get('/people', async(req, res) => {
   const users =  await User.find({}).catch(err=>{console.log(err)});
   res.json(users);
})



app.get('/profile', (req, res)=>{
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if(err) throw err;
            res.json(userData);
        })
    }else{
        res.status(401).json('no token');
    }
});



app.post('/login', async (req, res) => {
    console.log("connected to login");
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email }).catch(err=>{console.log(err)});
    if (userDoc) {
        console.log("found user");
        console.log(password);
        console.log(userDoc.password);
        const validPass = bcrypt.compareSync(password, userDoc.password);
        console.log(validPass);
        if (validPass) {
          const token =  await jwt.sign({ userId: userDoc._id, email, username:userDoc.username }, jwtSecret, {});
                res.cookie('token', token, { sameSite: 'none', secure: true }).json({
                    id: userDoc._id,
                });
        } else {
            res.status(422).json('password invalid');
        }
    } else {
        res.status(422).json('User cannot found');
    }
});


app.post('/logout', async(req, res) => {
    await res.clearCookie('token', { sameSite: 'none', secure: true }).json("Logged out successfully");
  });



app.post('/register', async (req, res) => {
    console.log("connected to register");
    const { username, email, password } = req.body;
    try {
        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email }).catch(err=>{console.log(err)});
        if (existingUser) {
            console.log("Already registered");
             return res.status(400).json({ error: 'Email already exists' });
        }

        const userInfo = await User.create({
             username, 
             email, 
             password:bcrypt.hashSync(password,bcryptSalt) }).catch(err=>console.log(err));

        const token = await jwt.sign({ userId: userInfo._id, email, username }, jwtSecret, {});
  
        console.log(token);
        console.log(userInfo);
  
        res.cookie('token', token, {sameSite:'none', secure: true}).status(201).json({
          id: userInfo._id,
        });
    }    catch (err) {
         console.error(err);
         res.status(500).json('error');
    }
  });





const server = app.listen(4040, (req, res) => {
    console.log('listening on port 3000');
})



const wss =  new ws.WebSocketServer({server});

const terminationTime = 30*60*1000;

wss.on('connection',(connection, req)=>{
    const loggedInUsers ={};
    connection.isAlive=true;
    connection.timer = setInterval(() =>
       {
        connection.ping();
       }, 5000);

       // Terminate the connection after the specified duration
       const timeoutId = setTimeout(() => {
        if (connection.isAlive) {
          connection.terminate();
          console.log('Connection terminated after', terminationTime, 'milliseconds');
        }
      }, terminationTime);
    
      // Clear the timeout if the connection is closed before the duration elapses
      connection.on('close', () => {
        clearTimeout(timeoutId);
      });


    //console.log(req.headers);
    //read username and id from the cookie for this connection
    try{
    const cookies = req.headers.cookie;
    if(cookies){
        const tokenCookieString=cookies.split(';').find(str=>str.startsWith('token='));
        if(tokenCookieString){
            const token = tokenCookieString.split('=')[1];
            if(token){
                jwt.verify(token, jwtSecret, {}, (err, userDoc)=>{
                    if(err)throw err;
                    console.log(userDoc);
                    const{userId, email, username} = userDoc;
                    connection.userId = userId;
                    connection.email = email;
                    connection.username=username;
                    if(loggedInUsers[userId]){
                        loggedInUsers[userId].connection.terminate();
                        console.log(`Terminated WebSocket connection for user: ${userId}`);
                    }
                    loggedInUsers[userId] = { connection, lastActivity: Date.now() };
                    connection.on('close', () => {
                        delete loggedInUsers[userId];
                        console.log(`Removed user: ${userId}`);
                      });
                })
            }else{
                console.log("check your token");
            }
        }else{
            console.log("token cookie string is empty");
        }
    }else{
        console.log("cookies does not exist");
    }
    }catch(err){console.log(err);}


    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const { recipient, text, file } = messageData;
        let filename = null;
    try{
        if(file){
            const parts = file.name.split('.');
            const ext = parts[parts.length-1];
            filename = Date.now()+ '.' + ext;
            const path = __dirname + '/uploads/' + filename;
            const bufferData = new Buffer.from(file.data.split(',')[1], 'base64');
            console.log(bufferData);
            fs.writeFile(path, bufferData, ()=>{
                console.log(" file saved" + path);
            })
        }
        if (recipient && (text||file)) {
          const senderId = connection.userId;
          
          // Check if the sender is authorized to send messages to the recipient
          const sender = await User.findById(senderId);
          if (sender) {
            const recipientUser = await User.findById(recipient).catch(err => {console.log(err)});
            if (recipientUser) {
              const messageDoc = await Message.create({
                sender: senderId,
                recipient,
                text,
                file:file?filename:null,
              }).catch(err=>{console.log(err)});
              [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c =>
                  c.send(
                    JSON.stringify({
                      text,
                      sender: senderId,
                      recipient,
                      file:file?filename:null,
                      id: messageDoc._id,
                    })
                  )
                );
            } else {
              console.log('Recipient user not found');
            }
          } else {
            console.log('Sender user not found');
          }
        }
    }catch(err) {console.log(err);}
      });



//notify everyone about online people
    console.log([...wss.clients].map(c=>c.username));
    [...wss.clients].forEach(client=>{
        client.send(JSON.stringify({
            online:[...wss.clients].map(c=>({
                userId: c.userId,
                username: c.username,
            }))
        }))
    })
});

