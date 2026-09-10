# ADR-001: Use Redis to Track In-Progress Inventory Requests

Date: 10-09-2026

Deciders: Head of Engineering, Lead Architect, Hajj Team Lead

## Context

Inventory requests can be processed by Moroor users.

To prevent the same request from being processed by more than one user at the same time, the system needs to know whether a request is currently under processing.

Previously, this state was stored in the SQL Server database.

When a user started processing an inventory request, the request was marked in the database as being under processing. Other users were prevented from processing the same request until the current processing operation was completed or released.

Storing this temporary processing state in the database introduces unnecessary database updates and couples short-lived processing locks with persistent request data.

A faster and more suitable mechanism is required to manage this temporary state and prevent concurrent processing of the same inventory request.

## Decision

Redis will be used to track inventory requests that are currently under processing.

When a user starts processing an inventory request, the Inventory Service will create a Redis entry representing that the request is currently being processed.

Before allowing another user to process the same request, the Inventory Service will check Redis.

If the request already has an active processing entry, the new processing attempt will be rejected.

When processing is completed or cancelled, the Redis entry will be removed.

The SQL Server database will continue to store the permanent inventory request data and its business status.

Redis will only store the temporary processing state used to prevent concurrent processing.

Only the Inventory Service will access this Redis data directly.

## Consequences

### What gets better

- Temporary processing state is separated from permanent inventory request data.
- Fewer temporary updates are written to SQL Server.
- Multiple Inventory Service instances can share the same processing state.
- Checking whether a request is already under processing is fast.
- Redis expiration can be used to automatically release stale processing locks.
- The database remains focused on persistent business data.

### What gets worse

- Redis becomes required for processing inventory requests safely.
- Redis availability can affect the ability to start processing a request.
- Expiration time must be selected carefully.
- The system must ensure that processing entries are removed when processing finishes.
- Failure scenarios must be handled to avoid leaving a request locked longer than necessary.

## Status

Accepted