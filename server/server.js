const express = require('express');

const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*
https://learn-2.galvanize.com/cohorts/2476/blocks/94/content_files/Front%20End%20Capstone/project-atelier-catwalk/reviews.md
*/

// GET /reviews
app.get('/', (req, res) => {
  res.send('get reviews');
});

// GET /reviews/meta
app.get('/meta', (req, res) => {
  res.send('get meta');
});

// POST /reviews
app.post('/', (req, res) => {
  res.send('post reviews');
});

// PUT /reviews/:review_id/helpful
app.put('/*/helpful', (req, res) => {
  res.send('put helpful');
});

// PUT /reviews/:review_id/report
app.put('/*/report', (req, res) => {
  res.send('put report');
});

const port = 4001;
const server = app.listen(port, () => {
  console.log(`listening on port ${port}`);
});