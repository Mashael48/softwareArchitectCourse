
import express from 'express';

const app = express();
app.use(express.json());

const entities = new Map([
  ['E1', { id: 'E1', name: 'Alpha Transport', active: true }],
  ['E2', { id: 'E2', name: 'Beta Logistics', active: false }]
]);

app.get('/health', (req, res) => res.json({ service: 'entity-service', status: 'UP' }));

app.get('/entities', (req, res) => {
  res.json([...entities.values()]);
});

app.get('/entities/:id', (req, res) => {
  const entity = entities.get(req.params.id);
  if (!entity) return res.status(404).json({ message: 'Entity not found' });
  res.json(entity);
});

app.post('/entities', (req, res) => {
  const { id, name, active = true } = req.body;
  if (!id || !name) return res.status(400).json({ message: 'id and name are required' });
  if (entities.has(id)) return res.status(409).json({ message: 'Entity already exists' });

  const entity = { id, name, active };
  entities.set(id, entity);
  res.status(201).json(entity);
});

app.listen(3001, () => console.log('Entity Service running on port 3001'));
