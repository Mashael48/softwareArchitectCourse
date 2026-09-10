import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '20s', target: 10 },
    { duration: '10s', target: 0 }
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01']
  }
};

export default function () {
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'gateway health is 200': r => r.status === 200
  });

  const entities = http.get(`${BASE_URL}/entities`);
  check(entities, {
    'entities status is 200': r => r.status === 200
  });

  const inventory = http.get(`${BASE_URL}/inventory/E1`);
  check(inventory, {
    'inventory status is 200': r => r.status === 200
  });

  sleep(1);
}
