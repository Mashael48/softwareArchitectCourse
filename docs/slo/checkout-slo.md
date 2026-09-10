# Service Level Objective: Hajj Permit Checkout

Owner: Hajj Permit Team
Reviewed: every quarter
Status: Active

---

## 1. What we measure (the SLI)

The share of permit issuance requests that return a successful answer in under 400 milliseconds, measured at the Nginx Gateway, over a rolling 30 days.

A request counts as successful if it completes without a server-side failure.

We measure at the Gateway because it is the entry point closest to the client experience.

## 2. What we promise (the SLO)

99.5 percent of permit issuance requests should complete successfully in under 400 milliseconds over a rolling 30-day period.

## 3. Error budget

100 percent minus 99.5 percent gives an error budget of 0.5 percent.

This means up to 0.5 percent of permit issuance requests may fail or exceed the latency target during the 30-day window without violating the SLO.

## 4. Stop rule

If more than 50 percent of the error budget is consumed before the middle of the 30-day window:

- New feature work affecting permit issuance should pause.
- The team should focus on reliability and performance improvements.
- The issue should be reviewed by the Hajj Permit Team Lead.

If the full error budget is consumed:

- Deployments affecting permit issuance should be limited to fixes, rollbacks, or reliability improvements until the service recovers.

## 5. What we do not promise

- We do not guarantee the availability or response time of external systems such as NIC or Tawakkalna.
- We do not guarantee that every individual request completes under 400 milliseconds.
- The objective applies to the overall percentage of requests measured during the 30-day window.

## 6. Where the numbers come from

- Runtime measurement: Nginx Gateway access logs and request duration metrics.
- Before release: the k6 load test in `load/hajj-permit-load.js`.
- The k6 test currently requires p(95) latency below 300 milliseconds and an HTTP failure rate below 1 percent.

## 7. Named owner

The Hajj Permit Team is accountable for reviewing this SLO and responding when the error budget is being consumed too quickly.
