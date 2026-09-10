# Hajj Permit - Simple Microservices Course App

This is a deliberately small backend-only example based on the Hajj Permit architecture.

## Architecture

The project uses a microservices architecture with an Nginx API Gateway.

## Services

- Nginx Gateway - host port 3000
- Entity Service - port 3001
- Inventory Service - port 3002
- Permit Service - port 3003
- Notification Service - port 3004
- Redis - port 6379

There is no persistent database in this course implementation. Business data is kept in memory and is reset when the related service container restarts.

Redis is used only for temporary inventory-request processing locks.

NIC and Tawakkalna are mocked inside Permit Service.
The external SMS provider is mocked by Notification Service.

## Run

Build and start the application:

```bash
docker compose up -d --build
```

Check running containers:

```bash
docker compose ps
```

Use the Gateway at:

```text
http://localhost:3000
```

## Nginx commands

Validate the Nginx configuration:

```bash
docker compose exec gateway nginx -t
```

Reload Nginx after changing its configuration:

```bash
docker compose exec gateway nginx -s reload
```

View Gateway logs:

```bash
docker compose logs -f gateway
```

Stop the application:

```bash
docker compose down
```

## Example flow

### 1. Check Gateway health

```bash
curl http://localhost:3000/health
```

### 2. View entities

```bash
curl http://localhost:3000/entities
```

### 3. Check inventory

```bash
curl http://localhost:3000/inventory/E1
```

### 4. Create an inventory request

```bash
curl -X POST http://localhost:3000/inventory/requests \
  -H "Content-Type: application/json" \
  -d '{"entityId":"E1","amount":2}'
```

### 5. Start processing the inventory request

```bash
curl -X POST http://localhost:3000/inventory/requests/R1/process \
  -H "Content-Type: application/json" \
  -d '{"processorId":"moroor-1"}'
```

### 6. Approve the inventory request

```bash
curl -X POST http://localhost:3000/inventory/requests/R1/approve \
  -H "Content-Type: application/json" \
  -d '{"processorId":"moroor-1"}'
```

### 7. Issue a permit

```bash
curl -X POST http://localhost:3000/permits \
  -H "Content-Type: application/json" \
  -d '{"entityId":"E1","vehiclePlate":"ABC-1234"}'
```

## Load test

A k6 load test is available at:

```text
load/hajj-permit-load.js
```

Run it using Docker Compose:

```bash
docker compose --profile manual run --rm k6
```

The test checks Gateway health, Entity Service routing, and Inventory Service routing through Nginx.

Current thresholds:

- p(95) response time below 300 ms
- HTTP failure rate below 1%

## SLO

The Checkout / permit issuance SLO is documented at:

```text
docs/slo/checkout-slo.md
```

The current target is 99.5% successful permit issuance requests under 400 ms over a rolling 30-day period.

## Important architecture idea

Permit Service does not edit Inventory data directly.
It calls Inventory Service to consume one unit.

Clients do not call backend services directly during the normal flow. They enter through the Nginx Gateway.
