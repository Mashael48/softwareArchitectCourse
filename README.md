# Hajj Permit - Simple Node.js Microservices Course App

This is a deliberately small backend-only example based on the Hajj Permit architecture.

## Services

- Gateway - port 3000
- Entity Service - port 3001
- Inventory Service - port 3002
- Permit Service - port 3003
- Notification Service - port 3004

There is no database. All data is kept in memory and is reset whenever a container restarts.

NIC and Tawakkalna are mocked inside Permit Service.
The external SMS provider is mocked by Notification Service.

## Run

```bash
docker compose up --build
```

Use the Gateway at:

```text
http://localhost:3000
```

## Example flow

### 1. View entities

```bash
curl http://localhost:3000/entities
```

### 2. Check inventory

```bash
curl http://localhost:3000/inventory/E1
```

### 3. Create an inventory request

```bash
curl -X POST http://localhost:3000/inventory/requests \
  -H "Content-Type: application/json" \
  -d '{"entityId":"E1","amount":2}'
```

### 4. Approve the inventory request

```bash
curl -X POST http://localhost:3000/inventory/requests/R1/approve
```

### 5. Issue a permit

```bash
curl -X POST http://localhost:3000/permits \
  -H "Content-Type: application/json" \
  -d '{"entityId":"E1","vehiclePlate":"ABC-1234"}'
```

## Important architecture idea

Permit Service does not edit Inventory data directly.
It calls Inventory Service to consume one unit.

