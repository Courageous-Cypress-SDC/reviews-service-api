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
        let rating = data[2];
        let date = data[3];
        let summary = data[4];
        let body = data[5];
        let recommend = data[6];
        let reported = data[7];
        let reviewer_name = data[8];
        let reviewer_email = data[9];
        let response = data[10];
        let helpfulness = data[11];
        if (totalLines != 0) {
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