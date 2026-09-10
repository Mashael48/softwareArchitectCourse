## ADR: Digital Permit Display Service in Tawakkalna
Date:09-09-2026
Deciders: Head of Engineering, Lead Architect, Hajj Team Lead
## Context
As part of the Hajj project, Hajj permits are issued to organizations through the existing permit management process. Previously, once a permit was created and approved, the permit was provided as a physical copy that had to be printed through the application.

This approach required beneficiaries to rely on a printed permit when they needed to present or access their Hajj permit. The permit information was therefore not available to beneficiaries as a digital permit within Tawakkalna.

In addition, when the permit status or its details were changed after issuance, the printed permit could no longer represent the latest permit information. This created a need for beneficiaries to rely on the most recent printed copy and increased the dependency on the existing printing process.

The absence of a digital representation of the approved permit in Tawakkalna also limited the ability to provide beneficiaries with a more convenient and centralized way to access their valid Hajj permits.


## Decision
The implementation of the Permit Display Service to provide Hajj permits digitally through Tawakkalna is approved.

The existing Permit Service will remain the source of truth for Hajj permit information, including the permit status and details. The Permit Display Service will integrate with Tawakkalna to synchronize the approved permit information and any subsequent updates, allowing beneficiaries to access their valid permits digitally through Tawakkalna.

## Consequences
## What gets better
- Organizations can display their Hajj permits digitally through Tawakkalna.
- Provides a convenient digital experience for beneficiaries.
- Uses (Permit Service) as the main source of permit information.
- Reduces dependency on physical permits.
- Allows permit information to be updated and synchronized.
## What gets worse
- The solution depends on the availability of the Tawakkalna integration.
- Integration failures may delay the display or synchronization of permits.
- Additional monitoring mechanisms are required.
- Changes to the Tawakkalna integration interface may require updates to the Permit Service.

Status:
Accepted