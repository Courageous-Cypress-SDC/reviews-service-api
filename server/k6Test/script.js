import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1000,
  duration: '10s',
};

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

export default function () {
  // let prodId = getRandomInt(1, 1000001);
  // let prodId = getRandomInt(1,333333);
  // let prodId = getRandomInt(333334, 666666);
  let prodId = getRandomInt(666667, 1000001);
  let res = http.get(`http://localhost:8394/reviews/meta?product_id=${prodId}`);
  check(res, {
    'status was 200':
    (r) => {
      // console.log(r);
      // console.log(r.status);
      return r.status == 200;
    }
  });
  sleep(1);
}