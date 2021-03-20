const fs = require('fs');
const mysql = require('mysql');
const readline = require('readline');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'testCSVLoadOne'
});

let rows = [];
let weirdRows = [];

let totalLines = 0;
let counter = 0;
let characteristicIds = new Set();
let reviewIds = new Set();

// connection.connect((error) => {
//   if (error) {
//     console.error(error);
//   } else {
//     let cIdQuery = 'select id from characteristics';
//     connection.query(cIdQuery, (cIdErr, cIdRes) => {
//       if (cIdErr) {
//         console.error(cIdErr);
//       } else {
//         for (let i = 0; i < cIdRes.length; i++) {
//           characteristicIds.add(cIdRes[i].id);
//           let rIdQuery = 'select id from reviews';
//           connection.query(rIdQuery, (rIdErr, rIdRes) => {
//             if (rIdErr) {
//               console.error(rIdErr);
//             } else {
//               for (let i = 0; i < rIdRes.length; i++) {
//                 reviewIds.add(rIdRes[i].id);
//               }
//             }
//           })
//         }
//       }
//     })
//   }
// });

function loadCharReviews() {
  const stream = fs.createReadStream('characteristic_reviews.csv', 'UTF8');
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  });
  rl.on('line', (line) => {
    counter++;
    if (counter >= 1000000) {
      rl.pause();
    }
    let data = line.split(',');
    if (data.length !== 4) {
      weirdRows.push(totalLines);
      totalLines++;
      return;
    }
    let id = data[0];
    let charId = data[1];
    let reviewId = data[2];
    let value = parseInt(data[3]);
    if (isNaN(value) || value <= 0 || value > 5) {
      console.log('invalid value');
      totalLines++;
      return;
    }
    if (totalLines != 0) {
      rows.push([id, charId, reviewId, value]);
    }
    totalLines++;
  })
    .on('error', (error) => {
      console.error(error);
      connection.end();
    })
    .on('pause', () => {
      console.log('paused');
      console.log(totalLines);
      console.log(rows.length);
      console.log('weird rows: ', JSON.stringify(weirdRows));
      let query =
        'INSERT INTO characteristics_reviews (id, characteristic_id, review_id, value) VALUES ?';
      connection.query(query, [rows], (error, response) => {
        if (error) {
          console.log(error);
        } else {
          console.log(response);
        }
        rows = [];
        counter = 0;
        rl.resume();
      })
    })
    .on('close', () => {
      console.log('read entire file');
      console.log(totalLines);
      console.log(rows.length);
      console.log('weird rows: ', JSON.stringify(weirdRows));
      connection.end();
    });
}
// id, characteristic_id, review_id, value
// make sure characteristic_id and review_id exist
loadCharReviews();
