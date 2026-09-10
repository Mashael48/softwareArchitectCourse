# ADR-002: Use Redis to Track In-Progress Inventory Requests

Date: 10-09-2026

Deciders: Head of Engineering, Lead Architect, Hajj Team Lead

## Status

Accepted

## Context

Inventory requests can be processed by Moroor users.

To prevent the same request from being processed by more than one user at the same time, the system needs to know whether a request is currently under processing.

Previously, this state was stored in the SQL Server database. When a user started processing an inventory request, the request was marked in the database as being under processing. Other users were prevented from processing the same request until the current processing operation was completed or released.

This processing state is temporary coordination state rather than permanent business data. Storing it in the database introduces unnecessary reads and writes and couples short-lived processing locks with persistent request data.

## Decision

Redis will be used to track inventory requests that are currently under processing.

When a user starts processing an inventory request, the Inventory Service will create a Redis entry for that request. The entry is created atomically so only one user can acquire the processing lock.

Before another user can process the same request, the Inventory Service checks Redis. If the processing entry already exists, the new attempt is rejected.

When processing is completed or cancelled, the Redis entry is removed.

The processing entry also has an expiration time so a stale lock does not remain forever if processing stops unexpectedly.

SQL Server remains responsible for permanent inventory request data and business status. Redis stores only the temporary processing state.

Only the Inventory Service accesses this Redis data directly.

## Alternatives Considered

### Store the processing state in SQL Server

This was the previous implementation. It prevents concurrent processing, but requires database reads and writes for temporary coordination state that does not need permanent persistence.

### Store the processing state in application memory

This is simple, but the state would only exist inside one Inventory Service instance. Multiple instances could have different views of which requests are being processed, and the state would be lost when an instance restarts.

### Use Redis

Redis provides fast access to temporary shared state and supports atomic operations and expiration. Multiple Inventory Service instances can use the same processing state.

Redis was selected.

## Consequences

### What gets better

- Temporary processing state is separated from permanent request data.
- Fewer temporary reads and writes are required in SQL Server.
- Multiple Inventory Service instances can share the same processing state.
- Atomic Redis operations prevent two users from acquiring the same request at the same time.
- Expiration can automatically release stale processing locks.
- The database remains focused on persistent business data.

### What gets worse

- Redis becomes required for safely starting inventory request processing.
- Redis availability can affect the ability to start processing a request.
- The expiration period must be selected carefully.
- The application must release the processing entry when processing completes or is cancelled.
