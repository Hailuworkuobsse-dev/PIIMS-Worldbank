# On-Call Rotation

## Schedule

| Week | Primary       | Secondary     | Escalation |
| ---- | ------------- | ------------- | ---------- |
| W1   | MoWE Lead Dev | MoWE DevOps   | MoWE CIO   |
| W2   | MoWE DevOps   | MoWE Lead Dev | MoWE CIO   |
| W3   | MoWE Lead Dev | MoWE DevOps   | MoWE CIO   |
| W4   | MoWE DevOps   | MoWE Lead Dev | MoWE CIO   |

Rotation is Monday 09:00 EAT → Monday 09:00 EAT.

## Responsibilities

- Respond to P1 alerts within **15 minutes**
- Respond to P2 alerts within **2 hours**
- Respond to P3 (normal) within **1 business day**
- Keep the incident log updated in `docs/incidents/`

## Escalation matrix

| Severity | Definition                              | Response | Escalation                |
| -------- | --------------------------------------- | -------- | ------------------------- |
| **P1**   | Production down or data loss            | 15 min   | → CIO immediately         |
| **P2**   | Major feature broken, no workaround     | 2 hours  | → CIO within 4 h          |
| **P3**   | Minor feature broken, workaround exists | 1 day    | → Team lead within 3 days |
| **P4**   | Cosmetic or documentation               | 1 week   | No escalation             |

## Contacts

- Primary on-call: `oncall-primary@piims.gov.et`
- Secondary on-call: `oncall-secondary@piims.gov.et`
- CIO: `cio@mowe.gov.et`
- World Bank TTL: TBD

## Handover checklist

Each Monday, outgoing on-call hands over to incoming:

- [ ] Any open incidents
- [ ] Pending deployments
- [ ] Known issues and workarounds
- [ ] Upcoming maintenance windows