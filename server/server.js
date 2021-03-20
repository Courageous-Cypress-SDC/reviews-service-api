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
/*
{
  "product": "2",
  "page": 0,
  "count": 5,
  "results": [
    {
      "review_id": 5,
      "rating": 3,
      "summary": "I'm enjoying wearing these shades",
      "recommend": false,
      "response": null,
      "body": "Comfortable and practical.",
      "date": "2019-04-14T00:00:00.000Z",
      "reviewer_name": "shortandsweeet",
      "helpfulness": 5,
      "photos": [{
          "id": 1,
          "url": "urlplaceholder/review_5_photo_number_1.jpg"
        },
        {
          "id": 2,
          "url": "urlplaceholder/review_5_photo_number_2.jpg"
        },
        // ...
      ]
    },
    {
      "review_id": 3,
      "rating": 4,
      "summary": "I am liking these glasses",
      "recommend": false,
      "response": "Glad you're enjoying the product!",
      "body": "They are very dark. But that's good because I'm in very sunny spots",
      "date": "2019-06-23T00:00:00.000Z",
      "reviewer_name": "bigbrotherbenjamin",
      "helpfulness": 5,
      "photos": [],
    },
    // ...
  ]
}
*/
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
  // let query =
  //   `select r.id, r.product_id, r.rating, r.date, r.body, r.recommend, r.reported, r.reviewer_name, r.reviewer_email, r.response, r.helpful, ph.url
  //   from products p
  //   INNER JOIN reviews r
  //   on p.id = r.product_id
  //   left join photos ph
  //   on r.id = ph.review_id
  //   where p.id = ${productId}
  //   limit ${count}`;

  let query =
    `select r.id as review_id, r.rating, r.summary, r.recommend, r.response, r.body, r.date, r.reviewer_name, r.helpful as helpfulness
    from products p
    INNER JOIN reviews r
    on p.id = r.product_id
    where p.id = ${productId}
    limit ${count}`;

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
      for (let i = 0; i < response.length; i++) {
        let photoQuery =
          `select ph.id, url
          from photos ph
          inner join reviews r
          on r.id = ph.review_id
          where r.id = ${response[i].review_id}`
        connection.query(photoQuery, (phErr, phRes) => {
          if (phErr) {
            res.status(500).send(phErr);
          } else {
            console.log('get reviews photos success');
            responseObj.results[i].photos = phRes;
            if (i === response.length - 1) {
              res.send(responseObj);
            }
          }
        });
      }
      // res.send(response);
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
  let ratings = [];
  let recommends = [];
  let characteristics = [];
  //count(r.rating) as rating group by r.rating
  let ratingQuery =
    `select p.id, r.rating, count(r.rating) as ratingCount
    from products p inner join reviews r
    on p.id = r.product_id
    where p.id = ${productId}
    group by r.rating
    order by r.rating`;
  //let query = `select count(rating) from reviews where product_id = ${productId} group by rating`;
  connection.query(ratingQuery, (error, response) => {
    if (error) {
      res.status(500).send(error);
    } else {
      console.log('get meta rating success', response);
      ratings = response;
      let recommendQuery =
        `select p.id, r.recommend, count(r.recommend) as recommendCount
        from products p inner join reviews r
        on p.id = r.product_id
        where p.id = ${productId}
        group by r.recommend
        order by r.recommend`;
      connection.query(recommendQuery, (recErr, recRes) => {
        if (recErr) {
          res.status(500).send(recErr);
        } else {
          console.log('get meta recommend success', recRes);
          recommends = recRes;
          let charQuery =
            `select p.id as productId, c.id, c.name, avg(cr.value) as value
            from products p
            inner join characteristics c
            on p.id = c.product_id
            inner join characteristics_reviews cr
            on cr.characteristic_id = c.id
            where p.id = ${productId}
            group by c.id, c.name`;
          connection.query(charQuery, (charErr, charRes) => {
            if (charErr) {
              res.status(500).send(charErr);
            } else {
              console.log('get meta char success', charRes);
              characteristics = charRes;
              res.send({ ratings, recommends, characteristics });
            }
          })
        }
      })
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