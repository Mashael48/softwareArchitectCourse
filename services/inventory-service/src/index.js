import express from 'express';
import { createClient } from 'redis';

const app = express();
app.use(express.json());

const ENTITY_URL = process.env.ENTITY_URL || 'http://localhost:3001';
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://localhost:3004';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PROCESSING_TTL_SECONDS = 120;

const redis = createClient({ url: REDIS_URL });
redis.on('error', error => console.error('Redis error:', error));

const inventory = new Map([
  ['E1', 3],
  ['E2', 1]
]);

const requests = [];

function processingKey(requestId) {
  return `inventory-request:${requestId}:processing`;
}

async function notify(entityId, message) {
  await fetch(`${NOTIFICATION_URL}/notifications`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ entityId, message })
  });
}

app.get('/health', (req, res) => res.json({ service: 'inventory-service', status: 'UP' }));

app.get('/inventory/requests', (req, res) => {
  if (requests.length === 0) {
    return res.status(200).json([]);
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

// Marks a request as currently being processed.
// Redis SET NX makes the lock creation atomic, so only one user can acquire it.
app.post('/inventory/requests/:id/process', async (req, res) => {
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'PENDING') {
    return res.status(400).json({ message: 'Request is already processed' });
  }

  const { processorId } = req.body;
  if (!processorId) {
    return res.status(400).json({ message: 'processorId is required' });
  }

  const result = await redis.set(
    processingKey(request.id),
    processorId,
    { NX: true, EX: PROCESSING_TTL_SECONDS }
  );

  if (result !== 'OK') {
    const currentProcessor = await redis.get(processingKey(request.id));
    return res.status(409).json({
      message: 'Request is already under processing',
      requestId: request.id,
      processorId: currentProcessor
    });
  }

  res.json({
    requestId: request.id,
    status: 'PROCESSING',
    processorId,
    expiresInSeconds: PROCESSING_TTL_SECONDS
  });
});

// Releases the temporary processing lock, for example when processing is cancelled.
app.delete('/inventory/requests/:id/process', async (req, res) => {
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });

  const { processorId } = req.body;
  if (!processorId) {
    return res.status(400).json({ message: 'processorId is required' });
  }

  const currentProcessor = await redis.get(processingKey(request.id));

  if (!currentProcessor) {
    return res.status(404).json({ message: 'Request is not under processing' });
  }

  if (currentProcessor !== processorId) {
    return res.status(409).json({
      message: 'Request is being processed by another user',
      requestId: request.id,
      processorId: currentProcessor
    });
  }

  await redis.del(processingKey(request.id));
  res.json({ requestId: request.id, status: 'RELEASED' });
});

app.post('/inventory/requests/:id/approve', async (req, res) => {
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'PENDING') {
    return res.status(400).json({ message: 'Request is already processed' });
  }

  const { processorId } = req.body;
  if (!processorId) {
    return res.status(400).json({ message: 'processorId is required' });
  }

  const currentProcessor = await redis.get(processingKey(request.id));

  if (!currentProcessor) {
    return res.status(409).json({ message: 'Request must be marked as under processing first' });
  }

  if (currentProcessor !== processorId) {
    return res.status(409).json({
      message: 'Request is being processed by another user',
      requestId: request.id,
      processorId: currentProcessor
    });
  }

  request.status = 'APPROVED';
  const current = inventory.get(request.entityId) || 0;
  inventory.set(request.entityId, current + request.amount);

  await redis.del(processingKey(request.id));
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

await redis.connect();

app.listen(3002, () => console.log('Inventory Service running on port 3002'));