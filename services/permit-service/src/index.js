
import express from 'express';

const app = express();
app.use(express.json());

const ENTITY_URL = process.env.ENTITY_URL || 'http://localhost:3001';
const INVENTORY_URL = process.env.INVENTORY_URL || 'http://localhost:3002';
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://localhost:3004';

const permits = new Map();

async function validateWithNic(vehiclePlate) {
  // Mock NIC integration
  return {
    valid: Boolean(vehiclePlate),
    vehiclePlate
  };
}

async function consumeInventory(entityId) {
  const response = await fetch(`${INVENTORY_URL}/inventory/consume`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ entityId, amount: 1 })
  });

  return {
    ok: response.ok,
    body: await response.json()
  };
}

async function syncWithTawakkalna(permit) {
  // Mock Tawakkalna integration
  console.log(`[TAWAKKALNA MOCK] permit ${permit.id} synchronized`);
  return { synchronized: true };
}

async function notify(entityId, message) {
  await fetch(`${NOTIFICATION_URL}/notifications`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ entityId, message })
  });
}

app.get('/health', (req, res) => res.json({ service: 'permit-service', status: 'UP' }));

app.get('/permits', (req, res) => {
  res.json([...permits.values()]);
});

app.get('/permits/:id', (req, res) => {
  const permit = permits.get(req.params.id);
  if (!permit) return res.status(404).json({ message: 'Permit not found' });
  res.json(permit);
});

app.post('/permits', async (req, res) => {
  const { entityId, vehiclePlate } = req.body;

  if (!entityId || !vehiclePlate) {
    return res.status(400).json({ message: 'entityId and vehiclePlate are required' });
  }

  const nicResult = await validateWithNic(vehiclePlate);
  if (!nicResult.valid) {
    return res.status(400).json({ message: 'Vehicle validation failed' });
  }

  const inventoryResult = await consumeInventory(entityId);
  if (!inventoryResult.ok) {
    return res.status(409).json(inventoryResult.body);
  }

  const permit = {
    id: `P${permits.size + 1}`,
    entityId,
    vehiclePlate,
    status: 'ISSUED'
  };

  permits.set(permit.id, permit);

  const tawakkalna = await syncWithTawakkalna(permit);
  await notify(entityId, `Permit ${permit.id} was issued`);

  res.status(201).json({
    permit,
    nic: nicResult,
    inventory: inventoryResult.body,
    tawakkalna
  });
});

app.listen(3003, () => console.log('Permit Service running on port 3003'));
