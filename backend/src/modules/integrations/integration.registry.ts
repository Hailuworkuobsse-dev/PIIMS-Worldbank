import type { IntegrationCode, IntegrationMetadata } from './integration.types.js';

export const INTEGRATION_REGISTRY: Record<IntegrationCode, IntegrationMetadata> = {
  FMIS: {
    code: 'FMIS',
    name: 'MoF IFMIS',
    description: 'Ministry of Finance Integrated Financial Management Information System',
    direction: 'BIDIRECTIONAL',
    protocol: 'REST + HTTPS',
    baseUrlEnvVar: 'FMIS_BASE_URL',
    apiKeyEnvVar: 'FMIS_API_KEY',
    scheduleEnvVar: 'FMIS_SYNC_SCHEDULE',
    defaultSchedule: '0 2 * * *'
  },
  DBE: {
    code: 'DBE',
    name: 'DBE Loan Management',
    description: 'Development Bank of Ethiopia — on-lending and disbursement tracking',
    direction: 'BIDIRECTIONAL',
    protocol: 'REST + HTTPS',
    baseUrlEnvVar: 'DBE_BASE_URL',
    apiKeyEnvVar: 'DBE_API_KEY',
    scheduleEnvVar: 'DBE_SYNC_SCHEDULE',
    defaultSchedule: '15 2 * * *'
  },
  WB: {
    code: 'WB',
    name: 'World Bank Reporting',
    description: 'World Bank supervision and reporting systems (ISR/PPMR)',
    direction: 'OUTBOUND',
    protocol: 'SFTP + REST',
    baseUrlEnvVar: 'WB_BASE_URL',
    scheduleEnvVar: 'WB_SYNC_SCHEDULE',
    defaultSchedule: '0 3 1 * *'
  },
  SMS: {
    code: 'SMS',
    name: 'SMS Gateway',
    description: 'Telecom SMS gateway for beneficiary communication',
    direction: 'BIDIRECTIONAL',
    protocol: 'SMPP + REST',
    baseUrlEnvVar: 'SMS_GATEWAY_URL',
    apiKeyEnvVar: 'SMS_GATEWAY_KEY'
  },
  USSD: {
    code: 'USSD',
    name: 'USSD Gateway',
    description: 'Telecom USSD gateway for feature phone self-service',
    direction: 'BIDIRECTIONAL',
    protocol: 'REST',
    baseUrlEnvVar: 'USSD_GATEWAY_URL',
    apiKeyEnvVar: 'USSD_GATEWAY_KEY'
  },
  MOBILE_MONEY: {
    code: 'MOBILE_MONEY',
    name: 'Mobile Money',
    description: 'Mobile money provider for beneficiary disbursements',
    direction: 'BIDIRECTIONAL',
    protocol: 'REST',
    baseUrlEnvVar: 'MOBILE_MONEY_BASE_URL',
    apiKeyEnvVar: 'MOBILE_MONEY_KEY'
  },
  GIS: {
    code: 'GIS',
    name: 'GIS Platform',
    description: 'Geospatial platform for basemaps, boundaries, and spatial services',
    direction: 'BIDIRECTIONAL',
    protocol: 'REST + WMS/WFS',
    baseUrlEnvVar: 'GIS_BASE_URL',
    apiKeyEnvVar: 'GIS_API_KEY'
  },
  IDP: {
    code: 'IDP',
    name: 'Government IdP (SSO)',
    description: 'Government identity provider for federated login',
    direction: 'INBOUND',
    protocol: 'OIDC / SAML',
    baseUrlEnvVar: 'IDP_ISSUER_URL',
    apiKeyEnvVar: 'IDP_CLIENT_ID'
  },
  ODK: {
    code: 'ODK',
    name: 'ODK Central',
    description: 'Open Data Kit Central for survey form distribution and submissions',
    direction: 'BIDIRECTIONAL',
    protocol: 'REST + XLSForm',
    baseUrlEnvVar: 'ODK_BASE_URL',
    apiKeyEnvVar: 'ODK_API_KEY',
    scheduleEnvVar: 'ODK_SYNC_SCHEDULE',
    defaultSchedule: '*/15 * * * *'
  },
  SAFE_ROOM: {
    code: 'SAFE_ROOM',
    name: 'Safe Room / Research Platform',
    description: 'Secure platform for anonymized research dataset releases',
    direction: 'OUTBOUND',
    protocol: 'SFTP',
    baseUrlEnvVar: 'SAFE_ROOM_URL'
  }
};