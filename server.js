'use strict';
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const https = require('https');
const fs = require('fs');
require("dotenv-safe").config();

const app = express();

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

app.get('/AMBA/api/students', (req, res) => {
    return res.send(`GET HTTP method on students resource\n ${(new Date()).toString()}`);
});
   
app.post('/AMBA/api/students', (req, res) => {
    return res.send('POST HTTP method on students resource');
});
   
app.put('/AMBA/api/students/:studentId', (req, res) => {
    return res.send(
      `PUT HTTP method on student/${req.params.studentId} resource`,
    );
});
   
app.delete('/AMBA/api/students/:studentId', (req, res) => {
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