'use strict';
const express = require("express");
require("dotenv-safe").config();
 
const app = express();
app.use(express.json())

app.get('/api/students', (req, res) => {
    return res.send('GET HTTP method on students resource');
  });
   
  app.post('/api/students', (req, res) => {
    return res.send('POST HTTP method on students resource');
  });
   
  app.put('/api/students/:studentId', (req, res) => {
    return res.send(
      `PUT HTTP method on student/${req.params.studentId} resource`,
    );
  });
   
  app.delete('/api/students/:studentId', (req, res) => {
    return res.send(
      `DELETE HTTP method on student/${req.params.studentId} resource`,
    );
  });
   
  app.listen(process.env.PORT, () =>
  console.log(`Example app listening on port ${process.env.PORT}!`),
);