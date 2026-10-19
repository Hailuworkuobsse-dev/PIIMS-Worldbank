/**
 * Aggregates all English namespaces into a single flat object.
 * Every feature owns its own file — no more merge conflicts.
 */
import common from "./common.json";
import auth from "./auth.json";
import projects from "./projects.json";
import inception from "./inception.json";
import results from "./results.json";
import financial from "./financial.json";
import procurement from "./procurement.json";
import supplier from "./supplier.json";
import beneficiaries from "./beneficiaries.json";
import geo from "./geo.json";
import documents from "./documents.json";
import grievance from "./grievance.json";
import impactIndicators from "./impact-indicators.json";
import survey from "./survey.json";
import field from "./field.json";
import qa from "./qa.json";
import warehouse from "./warehouse.json";
import analytics from "./analytics.json";
import admin from "./admin.json";
import reports from "./reports.json";
import research from "./research.json";

export const en = {
  ...common,
  ...auth,
  ...projects,
  ...inception,
  ...results,
  ...financial,
  ...procurement,
  ...supplier,
  ...beneficiaries,
  ...geo,
  ...documents,
  ...grievance,
  ...impactIndicators,
  ...survey,
  ...field,
  ...qa,
  ...warehouse,
  ...analytics,
  ...admin,
  ...reports,
  ...research,
};