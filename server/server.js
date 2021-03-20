const express = require('express');
const app = express();
const mysql = require('mysql');
const path = require('path');
const config = require('../config.js');
const url = require('url');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/*
https://learn-2.galvanize.com/cohorts/2476/blocks/94/content_files/Front%20End%20Capstone/project-atelier-catwalk/reviews.md
*/

const connection = mysql.createConnection({
  host: 'localhost',
  user: config.SQLUSER,
  password: config.SQLPASSWORD,
  database: config.SQLDATABASE
});

connection.connect((error) => {
  if (error) {
    console.error(error);
  } else {
    console.log('connected to mysql server');
  }
});

const reviewSorts = new Set(['newest', 'helpful', 'relevant']);

// GET /reviews
app.get('/', (req, res) => {
  const queryObject = url.parse(req.url,true).query;
  console.log(queryObject);

  const page = queryObject.page || 1;
  const count = queryObject.count || 5;
  const productId = queryObject.product_id;
  const sortBy = queryObject.sort || 'relevant';
  console.log(page, count, productId, sortBy);
  if (productId === undefined) {
    res.status(500).send('No product_id provided');
    return;
  }
  if (!reviewSorts.has(sortBy)) {
    res.status(500).send('Invalid sort method');
    return;
  }

  console.log('get reviews');
  let query = `select r.id, r.product_id, r.rating, r.date, r.body, r.recommend, r.reported, r.reviewer_name, r.reviewer_email, r.response, r.helpful from reviews r INNER JOIN products p on p.id = r.product_id where p.id = ${productId} limit ${count}`;
  connection.query(query, (error, response) => {
    if (error) {
      res.status(500).send(error);
    } else {
      console.log('get reviews success');
      res.send(response);
    }
  });
});

// GET /reviews/meta
/*
{
  "product_id": "2",
  "ratings": {
    2: 1,
    3: 1,
    4: 2,
    // ...
  },
  "recommended": {
    0: 5
    // ...
  },
  "characteristics": {
    "Size": {
      "id": 14,
      "value": "4.0000"
    },
    "Width": {
      "id": 15,
      "value": "3.5000"
    },
    "Comfort": {
      "id": 16,
      "value": "4.0000"
    },
    // ...
}
*/
app.get('/meta', (req, res) => {
  const queryObject = url.parse(req.url,true).query;
  console.log(queryObject);
  console.log('get meta');
  const productId = queryObject.product_id;
  //count(r.rating) as rating group by r.rating
  let query = `select p.id, r.rating, count(r.rating) as ratingCount from products p inner join reviews r on p.id = r.product_id where p.id = ${productId} group by r.rating order by r.rating`;
  //let query = `select count(rating) from reviews where product_id = ${productId} group by rating`;
  connection.query(query, (error, response) => {
    if (error) {
      res.status(500).send(error);
    } else {
      console.log('get meta success', response);
      res.send(response);
    }
  });
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