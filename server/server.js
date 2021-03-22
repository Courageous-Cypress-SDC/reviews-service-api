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
  database: config.SQLDATABASE,
  multipleStatements: true
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
  let order = 'r.helpful desc, r.date desc';
  if (sortBy === 'newest') {
    order = 'r.date desc';
  } else if (sortBy === 'helpful') {
    order = 'r.helpful desc';
  }
  // let query =
  //   `select r.id as review_id, r.rating, r.summary, r.recommend, r.response, r.body, r.date, r.reviewer_name, r.helpful as helpfulness
  //   from products p
  //   INNER JOIN reviews r
  //   on p.id = r.product_id
  //   where p.id = ${productId} and reported = 0
  //   order by ${order}
  //   limit ${count}`;
  let query = mysql.format('select r.id as review_id, r.rating, r.summary, r.recommend, r.response, r.body, r.date, r.reviewer_name, r.helpful as helpfulness from products p INNER JOIN reviews r on p.id = r.product_id where p.id = ? and reported = 0 order by ? limit ?', [parseInt(productId), order, parseInt(count)]);
  connection.query(query, (error, response) => {
    if (error) {
      res.status(500).send(error);
    } else {
      console.log('get reviews success');
      let responseObj = {
        product: productId,
        page: page,
        count: count,
        results: response,
      }
      if (response.length === 0) {
        res.send(responseObj);
      }
      const photoQueries = [];
      for (let i = 0; i < response.length; i++) {
        let photoQuery =
          `select ph.id, url
          from photos ph
          inner join reviews r
          on r.id = ph.review_id
          where r.id = ${response[i].review_id}`
        photoQueries[i] = photoQuery;
      }
      connection.query(photoQueries.join(';'), (phErr, phRes) => {
        if (phErr) {
          res.status(500).send(phErr);
        } else {
          console.log('get reviews photos success');
          for (let i = 0; i < response.length; i++) {
            responseObj.results[i].photos = phRes[i];
            let recommended = responseObj.results[i].recommend;
            responseObj.results[i].recommend = recommended === 0 ? false: true;
            if (i === response.length - 1) {
              res.send(responseObj);
            }
          }
        }
      });
    }
  });
});

// GET /reviews/meta
app.get('/meta', (req, res) => {
  const queryObject = url.parse(req.url,true).query;
  console.log(queryObject);
  console.log('get meta');
  const productId = queryObject.product_id;
  let responseObj = {
    product_id: productId,
  }
  // let ratingQuery =
  //   `select r.rating, count(r.rating) as ratingCount
  //   from products p
  //   inner join reviews r
  //   on p.id = r.product_id
  //   where p.id = ${productId}
  //   group by r.rating
  //   order by r.rating`;
  let ratingQuery = mysql.format('select r.rating, count(r.rating) as ratingCount from products p inner join reviews r on p.id = r.product_id where p.id = ? group by r.rating order by r.rating', [parseInt(productId)]);
  connection.query(ratingQuery, (error, response) => {
    if (error) {
      res.status(500).send(error);
    } else {
      console.log('get meta rating success', response);
      responseObj.ratings = {};
      for (let i = 0; i < response.length; i++) {
        responseObj.ratings[response[i].rating] = response[i].ratingCount;
      }
      // let recommendQuery =
      //   `select r.recommend, count(r.recommend) as recommendCount
      //   from products p
      //   inner join reviews r
      //   on p.id = r.product_id
      //   where p.id = ${productId}
      //   group by r.recommend
      //   order by r.recommend`;
      let recommendQuery = mysql.format('select r.recommend, count(r.recommend) as recommendCount from products p inner join reviews r on p.id = r.product_id where p.id = ? group by r.recommend order by r.recommend', [parseInt(productId)])
      connection.query(recommendQuery, (recErr, recRes) => {
        if (recErr) {
          res.status(500).send(recErr);
        } else {
          console.log('get meta recommend success', recRes);
          responseObj.recommended = {};
          for (let i = 0; i < recRes.length; i++) {
            responseObj.recommended[recRes[i].recommend] = recRes[i].recommendCount;
          }
          // let charQuery =
          //   `select c.id, c.name, avg(cr.value) as value
          //   from products p
          //   inner join characteristics c
          //   on p.id = c.product_id
          //   inner join characteristics_reviews cr
          //   on cr.characteristic_id = c.id
          //   where p.id = ${productId}
          //   group by c.id, c.name`;
          let charQuery = mysql.format('select c.id, c.name, avg(cr.value) as value from products p inner join characteristics c on p.id = c.product_id inner join characteristics_reviews cr on cr.characteristic_id = c.id where p.id = ? group by c.id, c.name', [parseInt(productId)]);
          connection.query(charQuery, (charErr, charRes) => {
            if (charErr) {
              res.status(500).send(charErr);
            } else {
              console.log('get meta char success', charRes);
              responseObj.characteristics = {};
              for (let i = 0; i < charRes.length; i++) {
                responseObj.characteristics[charRes[i].name] = {};
                responseObj.characteristics[charRes[i].name].id = charRes[i].id;
                responseObj.characteristics[charRes[i].name].value = charRes[i].value;
              }
              res.send(responseObj);
            }
          })
        }
      })
    }
  });
});

// POST /reviews
app.post('/', (req, res) => {
  const {
    product_id,
    rating,
    summary,
    body,
    recommend,
    name,
    email,
    photos,
    characteristics
  } = req.body;
  console.log(req.body);
  // validate date here
  // transaction
  connection.beginTransaction((err) => {
    if (err) {
      console.error(err);
      res.status(500).send(err);
    } else {
      let options = [product_id, rating, summary, body, recommend, name, email];
      let query =
        `insert into reviews (product_id, rating, summary, body, recommend, name, email, photos, characteristics) values (?, ?, ?, ?, ?, ?, ?)`;
      connection.query(query, options, (err, results, fields) => {
        if (err) {
          console.error(err);
          connection.rollback(function() {
            res.status(500).send(err);
          });
          return;
        } else {
          console.log('inserted into reviews');
          let newReviewId = results.insertId;
          //insert into photos,
          //insert into characteristics
          // product_id, name -> get char_id
          // insert into char_reviews (char_id, review_id, value);
          // https://stackoverflow.com/questions/49529231/transaction-management-in-nodejs-with-mysql
          if (photos.length > 0) {
            let photosQuery =
              `insert into photos (review_id, url) values ?`;
            let photoOptions = [];
            for (let i = 0; i < photos.length; i++) {
              photoOptions.push([newReviewId, photos[i]]);
            }
            connection.query(photosQuery, [photoOptions], (err, results, fields) => {
              if (err) {
                console.error(err);
                connection.rollback(function() {
                  res.status(500).send(err);
                });
                return;
              } else {
                res.status(201).send('');
              }
            });
          }
          //console.log('asdf');
        }
      });
    }
  })
  //res.send('post reviews');
});

// PUT /reviews/:review_id/helpful
app.put('/*/helpful', (req, res) => {
  console.log(req.url);
  let reviewId = req.url.split('/')[1];
  // let query =
  //   `update reviews
  //   set helpful = helpful + 1
  //   where id = ${reviewId}`;
  let query = mysql.format('update reviews set helpful = helpful + 1 where id = ?', [parseInt(reviewId)]);
  connection.query(query, (error, response) => {
    if (error) {
      res.status(500).send(error);
    } else {
      console.log('updated', reviewId);
      res.status(204).send('');
    }
  });
});

// PUT /reviews/:review_id/report
app.put('/*/report', (req, res) => {
  console.log(req.url);
  let reviewId = req.url.split('/')[1];
  // let query =
  //   `update reviews
  //   set reported = 1
  //   where id = ${reviewId}`;
  let query = mysql.format('update reviews set reported = 1 where id = ?', [parseInt(reviewId)]);
  connection.query(query, (error, response) => {
    if (error) {
      res.status(500).send(error);
    } else {
      console.log('reported', reviewId);
      res.status(204).send('');
    }
  });
});

const port = 4001;
const server = app.listen(port, () => {
  console.log(`listening on port ${port}`);
});