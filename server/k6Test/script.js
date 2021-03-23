import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  let res = http.get('http://localhost:4001/?productId=1000000');
  check(res, {
    'status was 200':
    (r) => {console.log(r.status); return r.status == 200; }});

  sleep(1);
}