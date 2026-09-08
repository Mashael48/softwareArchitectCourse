# Hajj Permit (Vehicles) - Context Map

A bounded context defines where a business term has one clear meaning.

We have three main contexts:

---

## Context 1: Entity

Purpose: manage entities and their eligibility.

| Word | Meaning |
|---|---|
| entity | An organization using the Hajj Permit system |
| status | Whether the entity is active and eligible |

Promises:
- Provides entity information and eligibility.
- Other contexts reference entities by ID.
- Entity data is managed only inside the Entity context.

---

## Context 2: Inventory

Purpose: manage permit inventory and inventory requests.

| Word | Meaning |
|---|---|
| inventory | Number of permits available to an entity |
| request | A request for additional inventory |
| allocation | Inventory approved for an entity |
| entity | The entity that owns or requests the inventory |

Promises:
- Tracks available inventory.
- Processes inventory requests.
- Provides inventory availability to the Permit context.
- Does not manage entity details.

---

## Context 3: Permit

Purpose: issue and manage vehicle permits.

| Word | Meaning |
|---|---|
| permit | Authorization issued for a vehicle |
| vehicle | Vehicle validated through NIC |
| inventory | One available unit required to issue a permit |
| entity | The entity issuing the permit |

Promises:
- Validates vehicles through NIC.
- Checks and consumes inventory before issuing a permit.
- Sends issued permit information to Tawakkalna.
- Owns permit issuance and permit data.

---

## The border between them

Rule: Inventory and Permit reference the entity by ID and do not manage the full entity data.

The word `inventory` is shared between Inventory and Permit.

- In Inventory, inventory is the quantity of permits available to an entity.
- In Permit, inventory is one available unit required to issue a permit.

Rule: Permit does not update inventory directly. It asks Inventory to check availability and consume the required quantity.

---

## Relationship type

Entity is upstream of Inventory and Permit.

Inventory is upstream of Permit.

Permit integrates with NIC and Tawakkalna.

Notification is a supporting service used by the contexts to send SMS.