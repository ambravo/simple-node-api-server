'use strict';
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const https = require('https');
const fs = require('fs');
const fadmin = require('firebase-admin');
require("dotenv-safe").config();

const app = express();

//Firebase

const fkey = JSON.parse(
  Buffer.from(process.env.FIREBASE_KEY, 'base64').toString('binary')
);
fadmin.initializeApp({
  credential: fadmin.credential.cert(fkey)
});
const db = fadmin.firestore();

let setCache = function (req, res, next) {
   /*
  Note: Any method can be cached, but would that make sense? 
  GET and HEAD are safe methods to Cache. 
  POST can be cached, but an idempotency key should be used.

  By default: https://tools.ietf.org/html/rfc7231#section-4.2
  
  Method  |Idempotent  |Safe
  OPTIONS	|yes	       |yes
  GET	    |yes	       |yes
  HEAD	  |yes	       |yes
  PUT	    |yes	       |no
  POST	  |no	         |no
  DELETE	|yes	       |no
  PATCH	  |no	         |no
  */
  const period = 60 * 5 //Cache is in seconds, here is set to one minute
  if (req.method === 'GET') {
    res.set('Cache-control', `public, max-age=${period}`);
  } else {
    // for the other requests set strict no caching parameters
    res.set('Cache-control', `no-store`);
  }
  next();
}

app.use(express.json())
app.use(setCache)
app.use(morgan(':method :url :status :req[If-None-Match] :res[ETag] :res[content-length] - :response-time ms')); 
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], 
      scriptSrc: ["'self'"],
      styleSrc: ["'self'",  "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  }
}));

app.get('/AMBA/api/students/:studentId?', async (req, res) => {
  const studentId = req.params.studentId;
  if (studentId){
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.send(404);
    } else {
      res.setHeader("Content-Type","application/json");
      return res.send(studentDoc.data());
    }
  }
  else{
    const snapshot = await db.collection('students').get();
    res.setHeader("Content-Type","application/json");
    return res.send(snapshot.docs.map(doc => doc.data()));
  }
});   
app.post('/AMBA/api/students', async (req, res) => {
    const studentID = req.body.id;
    try{
      const studentRecord = await db.collection('students').doc(studentID).set(req.body);
      return res.send({
        studentID: studentID,
        ...studentRecord,
        message: "Student Created"
      });
    }
    catch(err){
      return res.send(400);
    }   
});
   
app.put('/AMBA/api/students/:studentId', async (req, res) => {
    return res.send(
      `PUT HTTP method on student/${req.params.studentId} resource`,
    );
});
   
app.delete('/AMBA/api/students/:studentId', async (req, res) => {
    return res.send(
      `DELETE HTTP method on student/${req.params.studentId} resource`,
    );
});

const port = process.env.EXPRESS_PORT || 3001;
if(process.env.EXPRESS_TLS.toUpperCase() === "TRUE"){
  const options = {
    key: fs.readFileSync(process.env.EXPRESS_TLS_KEY, 'utf8'),
    cert: fs.readFileSync(process.env.EXPRESS_TLS_CRT, 'utf8')
  };
  console.log(`Enabling TLS...`); 
  const server = https.createServer(options, app);
  server.listen(port, () => console.log(`Server listening on port ${port}`));
}else{
  console.log(`Insecure Server...`);
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}