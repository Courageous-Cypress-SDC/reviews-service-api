const fs = require('fs');
const es = require('event-stream');
const mysql = require('mysql');

let stream = fs.createReadStream('reviews.csv');
let csvData = [];

let totalLines = 0;
let rows = [];
let weirdRows = [];

// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '123456',
//   database: 'testCSVLoadOne'
// });

let productIds = new Set();
// connection.connect((error) => {
//   if (error) {
//     console.error(error);
//   } else {
//     let query = 'select id from products';
//     connection.query(query, (err, response) => {
//       if (err) {
//         console.log(err);
//       } else {
//         for (let i = 0; i < response.length; i++) {
//           productIds.add(response[i].id);
//         }
//         loadUsers();
//       }
//     });
//   }
// });
loadUsers();

function loadUsers() {
  stream
    .pipe(es.split())
    .pipe(
      es.mapSync(function(line) {
          let data = line.split(',');
          if (data.length !== 12) {
            //id, product_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness
            weirdRows.push(totalLines);
          }
          let id = data[0];
          let productId = data[1];
          // if (!productIds.has(productId)) {
          //   console.log('no product id found');
          //   totalLines++;
          //   return;
          // }
          let rating = data[2];
          let parsedRating = parseInt(rating);
          if (isNaN(parsedRating) || parsedRating < 0 || parsedRating > 5) {
            console.log('invalid rating');
            totalLines++;
            return;
          }
          let date = data[3];
          let summary = data[4].split('"')[1];
          if (summary.length > 60) {
            // console.log('summary too long');
            summary = summary.slice(0, 60);
            // totalLines++;
            // return;
          }
          let body = data[5].split('"')[1];
          if (body.length < 50) {
            //console.log('body too short');
            totalLines++;
            return;
          } else if (body.length > 1000) {
            console.log('body too long');
            body = body.slice(0, 1000);
          }
          let recommend = data[6];
          let reported = data[7];
          let reviewer_name = data[8];
          if (reviewer_name.length > 60) {
            console.log('reviewer name too long');
            reviewer_name = reviewer_name.slice(60);
          }
          let reviewer_email = data[9].split('"')[1];
          const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (reviewer_email.length > 60) {
            console.log('reviewer email too long');
            totalLines++;
            return;
          } else if (!emailRegex.test(reviewer_email)) {
            console.log('invalid email format');
            totalLines++;
            return;
          }
          let response = data[10];
          if (response && response.length > 1000) {
            console.log('response is too long');
            response = response.slice(1000);
          }
          let helpfulness = data[11];
          let parsedHelpful = parseInt(helpfulness);
          if (isNaN(parsedHelpful)) {
            console.log('invalid helpfulness');
            totalLines++;
            return;
          }
          if (totalLines != 0) {// && productIds.has(productId)) {
            rows.push([id, productId, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness]);
          }
          totalLines++;
        })
        .on('error', (error) => {
          console.error(error);
        })
        .on('end', () => {
          console.log('read entire file');
          console.log(totalLines);
          console.log(rows.length);
          console.log('weird rows: ', JSON.stringify(weirdRows));
          // const connection = mysql.createConnection({
          //   host: 'localhost',
          //   user: 'root',
          //   password: '123456',
          //   database: 'testCSVLoadOne'
          // });

          // // open the connection
          // connection.connect(error => {
          //   if (error) {
          //     console.error(error);
          //   } else {
          //     let query =
          //       'INSERT INTO reviewers (id, name) VALUES ?';
          //     connection.query(query, [rows], (error, response) => {
          //       console.log(error || response);
          //     });
          //   }
          // });
        })
    );
}