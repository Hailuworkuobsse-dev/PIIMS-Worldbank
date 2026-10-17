# Module Map

Quick reference for developers and reviewers.

| Module                    | Folder                       | Primary entities               | Permissions gate                                         |
| ------------------------- | ---------------------------- | ------------------------------ | -------------------------------------------------------- |
| **M1** Identity & Access  | `features/auth`              | User, Role, AuditLog           | — (cross-cutting)                                        |
| **M2** Project Registry   | `features/projects`          | Project, Component             | `project:read`, `project:write`                          |
| **M3** Inception Reports  | `features/inception`         | InceptionReport, ReviewComment | `inception:read`, `inception:submit`, `inception:review` |
| **M4** Results Framework  | `features/results`           | Indicator, IndicatorValue      | `result:read`, `result:write`                            |
| **M5** Financial          | `features/financial`         | Budget, Disbursement           | `budget:read`, `disbursement:write`                      |
| **M6** Procurement        | `features/procurement`       | Procurement, Contract          | `procurement:read`, `contract:write`                     |
| **M7** Supplier Portal    | `features/supplier`          | SupplierProfile, Delivery      | `supplier:self:read`                                     |
| **M8** Beneficiary        | `features/beneficiaries`     | Beneficiary, ServiceDelivery   | `beneficiary:read`, `beneficiary:write`                  |
| **M9** GIS                | `features/geo`               | GeoMarker, GeoVerify           | `geo:read`, `geo:write`                                  |
| **M10** Documents         | `features/documents`         | Document, Version              | `doc:read`, `doc:write`                                  |
| **M11** Reporting         | `features/reports`           | ReportInstance                 | `report:read`, `report:generate`                         |
| **M12** Dashboard         | `features/dashboard`         | KPIs                           | `dashboard:read`                                         |
| **M13** Grievance         | `features/grievances`        | Grievance, GrievanceAction     | `grievance:read`, `grievance:write`                      |
| **M14** Notifications     | `features/notifications`     | Notification                   | `notification:read`                                      |
| **M15** Integration       | `features/integration`       | SyncRun                        | `integration:read`                                       |
| **M16** Administration    | `features/admin`             | User, MasterData               | `admin:users`                                            |
| **M17** Mobile Offline    | `features/field` (shared)    | OfflineQueue                   | `field:capture`                                          |
| **M18** Impact Indicators | `features/impact-indicators` | ImpactIndicator                | `impact:design`                                          |
| **M19** Survey Builder    | `features/survey`            | Survey, Section, Question      | `survey:write`                                           |
| **M20** Field Collection  | `features/field`             | Submission, Paradata           | `collect:execute`                                        |
| **M21** QA                | `features/qa`                | QAFlag, Scorecard              | `qa:read`, `qa:review`                                   |
| **M22** Warehouse         | `features/warehouse`         | WaveDataset, ResearchDataset   | `warehouse:read`                                         |
| **M23** Impact Analytics  | `features/analytics`         | DiDResult, ImpactDashboard     | `impact:analytics:read`                                  |

## Cross-module data flow