
import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ service: 'notification-service', status: 'UP' }));

app.post('/notifications', (req, res) => {
  const { entityId, message } = req.body;

  console.log(`[SMS MOCK] entity=${entityId} message="${message}"`);

  res.status(202).json({
    status: 'accepted',
    channel: 'SMS',
    entityId,
    message
  });
});

app.listen(3004, () => console.log('Notification Service running on port 3004'));
