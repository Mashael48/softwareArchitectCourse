# Hajj Permit Course Demo – Full Flow Cheat Sheet

Use this sheet during the presentation to demonstrate the Hajj Permit backend through the **Gateway only**.

Gateway base URL:

```text
http://localhost:3000
```

---

## 1. Start the system

```cmd
docker compose down
```

```cmd
docker compose up -d --build
```

Check that all containers are running:

```cmd
docker compose ps
```

---

## 2. Health check

```cmd
curl.exe http://localhost:3000/health
```

Expected:

```json
{
  "service": "gateway",
  "status": "UP"
}
```

---

## 3. View entities

Get all entities:

```cmd
curl.exe http://localhost:3000/entities
```

Get entity `E1`:

```cmd
curl.exe http://localhost:3000/entities/E1
```

---

## 4. Check current inventory

```cmd
curl.exe http://localhost:3000/inventory/E1
```

Expected initially:

```json
{
  "entityId": "E1",
  "available": 3
}
```

---

## 5. View inventory requests

```cmd
curl.exe http://localhost:3000/inventory/requests
```

If the application was freshly restarted, the expected response is:

```json
[]
```

---

## 6. Create an inventory request

Request 5 additional permits for entity `E1`:

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests -H "Content-Type: application/json" -d "{\"entityId\":\"E1\",\"amount\":5}"
```

Expected:

```json
{
  "id": "R1",
  "entityId": "E1",
  "amount": 5,
  "status": "PENDING"
}
```

Presentation point:

- The request is stored as business data.
- It is still `PENDING`.
- Inventory has not increased yet.

---

## 7. Start processing the request

Simulate Moroor user `moroor-1` opening and processing request `R1`:

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests/R1/process -H "Content-Type: application/json" -d "{\"processorId\":\"moroor-1\"}"
```

Expected:

```json
{
  "requestId": "R1",
  "status": "PROCESSING",
  "processorId": "moroor-1",
  "expiresInSeconds": 120
}
```

Presentation point:

- The permanent request status is still `PENDING`.
- Redis now holds the temporary processing lock.
- The Redis key prevents another Moroor user from processing the same request at the same time.

---

## 8. Demonstrate Redis conflict protection

Try to process the same request using another user:

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests/R1/process -H "Content-Type: application/json" -d "{\"processorId\":\"moroor-2\"}"
```

Expected HTTP status:

```text
409 Conflict
```

Expected response:

```json
{
  "message": "Request is already under processing",
  "requestId": "R1",
  "processorId": "moroor-1"
}
```

Presentation point:

- Redis prevents concurrent processing.
- `moroor-2` cannot work on a request already locked by `moroor-1`.

---

## 9. Demonstrate that the wrong user cannot approve

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests/R1/approve -H "Content-Type: application/json" -d "{\"processorId\":\"moroor-2\"}"
```

Expected:

```text
409 Conflict
```

Presentation point:

- Only the user who owns the Redis processing lock can complete the operation.

---

## 10. Approve the request using the correct user

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests/R1/approve -H "Content-Type: application/json" -d "{\"processorId\":\"moroor-1\"}"
```

Expected:

```json
{
  "request": {
    "id": "R1",
    "entityId": "E1",
    "amount": 5,
    "status": "APPROVED"
  },
  "available": 8
}
```

Presentation point:

- The request becomes `APPROVED`.
- Inventory increases from `3` to `8`.
- The Redis processing lock is deleted.

---

## 11. Verify the updated inventory

```cmd
curl.exe http://localhost:3000/inventory/E1
```

Expected:

```json
{
  "entityId": "E1",
  "available": 8
}
```

---

## 12. Verify the request status

```cmd
curl.exe http://localhost:3000/inventory/requests
```

Expected to include:

```json
{
  "id": "R1",
  "entityId": "E1",
  "amount": 5,
  "status": "APPROVED"
}
```

---

# Optional: Demonstrate releasing a processing lock

Create a second request:

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests -H "Content-Type: application/json" -d "{\"entityId\":\"E1\",\"amount\":3}"
```

It should be created as `R2`.

Start processing it with `moroor-1`:

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests/R2/process -H "Content-Type: application/json" -d "{\"processorId\":\"moroor-1\"}"
```

Release the lock without approving:

```cmd
curl.exe -X DELETE http://localhost:3000/inventory/requests/R2/process -H "Content-Type: application/json" -d "{\"processorId\":\"moroor-1\"}"
```

Expected:

```json
{
  "requestId": "R2",
  "status": "RELEASED"
}
```

Now another user can acquire the same request:

```cmd
curl.exe -X POST http://localhost:3000/inventory/requests/R2/process -H "Content-Type: application/json" -d "{\"processorId\":\"moroor-2\"}"
```

---

# Optional: Issue a permit after inventory is approved

Create a vehicle permit:

```cmd
curl.exe -X POST http://localhost:3000/permits -H "Content-Type: application/json" -d "{\"entityId\":\"E1\",\"vehiclePlate\":\"ABC-1234\"}"
```

Then view all permits:

```cmd
curl.exe http://localhost:3000/permits
```

Get permit `P1`:

```cmd
curl.exe http://localhost:3000/permits/P1
```

Check inventory again:

```cmd
curl.exe http://localhost:3000/inventory/E1
```

Presentation point:

- Permit Service does not modify Inventory data directly.
- Permit Service calls Inventory Service to consume one inventory unit.
- The client still calls only the Gateway.

---

# Architecture summary for the presentation

```text
Client
  |
  v
Gateway :3000
  |
  +--> Entity Service
  |
  +--> Inventory Service
  |       |
  |       +--> Redis
  |       |     Temporary processing locks
  |       |
  |       +--> Notification Service
  |
  +--> Permit Service
          |
          +--> Inventory Service
          +--> Notification Service
          +--> NIC Mock
          +--> Tawakkalna Mock
```

Redis is used specifically for **temporary in-progress request state**.

SQL/business storage represents permanent request data, while Redis prevents two users from processing the same inventory request at the same time.
