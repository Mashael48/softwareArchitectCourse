
import express from 'express';

const app = express();
app.use(express.json());

const ENTITY_URL = process.env.ENTITY_URL || 'http://localhost:3001';
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://localhost:3004';

const inventory = new Map([
  ['E1', 3],
  ['E2', 1]
]);

const requests = [];

async function notify(entityId, message) {
  await fetch(`${NOTIFICATION_URL}/notifications`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ entityId, message })
  });
}

app.get('/health', (req, res) => res.json({ service: 'inventory-service', status: 'UP' }));

app.get('/inventory/requests', (req, res) => {
  if (!requests || requests.length === 0) {
    return res.status(201).json({ message: 'There is no requests' });


  }
  res.json(requests);
});

app.get('/inventory/:entityId', (req, res) => {
  res.json({
    entityId: req.params.entityId,
    available: inventory.get(req.params.entityId) || 0
  });
});

app.post('/inventory/requests', async (req, res) => {
  const { entityId, amount } = req.body;

  if (!entityId || !Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ message: 'entityId and positive integer amount are required' });
  }

  const request = {
    id: `R${requests.length + 1}`,
    entityId,
    amount,
    status: 'PENDING'
  };

  requests.push(request);
  await notify(entityId, `Inventory request ${request.id} was created`);

  res.status(201).json(request);
});

app.post('/inventory/requests/:id/approve', async (req, res) => {
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'PENDING') {
    return res.status(400).json({ message: 'Request is already processed' });
  }

  request.status = 'APPROVED';
  const current = inventory.get(request.entityId) || 0;
  inventory.set(request.entityId, current + request.amount);

  await notify(request.entityId, `Inventory request ${request.id} was approved`);

  res.json({
    request,
    available: inventory.get(request.entityId)
  });
});

app.post('/inventory/consume', (req, res) => {
  const { entityId, amount = 1 } = req.body;
  const available = inventory.get(entityId) || 0;

  if (available < amount) {
    return res.status(409).json({
      message: 'Not enough inventory',
      entityId,
      available
    });
  }

  inventory.set(entityId, available - amount);

  res.json({
    entityId,
    consumed: amount,
    remaining: inventory.get(entityId)
  });
});

app.listen(3002, () => console.log('Inventory Service running on port 3002'));
