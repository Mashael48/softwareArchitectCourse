
import express from 'express';

const app = express();
app.use(express.json());

const ENTITY_URL = process.env.ENTITY_URL || 'http://localhost:3001';
const INVENTORY_URL = process.env.INVENTORY_URL || 'http://localhost:3002';
const PERMIT_URL = process.env.PERMIT_URL || 'http://localhost:3003';

async function proxy(req, res, targetUrl) {
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: { 'content-type': 'application/json' },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body)
    });

    const text = await response.text();
    res.status(response.status);
    res.type(response.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (error) {
    res.status(502).json({ message: 'Service unavailable', error: error.message });
  }
}

app.get('/health', (req, res) => res.json({ service: 'gateway', status: 'UP' }));

app.use('/entities', (req, res) =>
  proxy(req, res, `${ENTITY_URL}/entities${req.url === '/' ? '' : req.url}`)
);

app.use('/inventory', (req, res) =>
  proxy(req, res, `${INVENTORY_URL}/inventory${req.url === '/' ? '' : req.url}`)
);

app.use('/permits', (req, res) =>
  proxy(req, res, `${PERMIT_URL}/permits${req.url === '/' ? '' : req.url}`)
);

app.listen(3000, () => console.log('Gateway running on port 3000'));
