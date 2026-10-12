import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { loadEnv } from 'vite';

const api = {
  organizations: {
    listOrganizations: makeFunctionReference('organizations:listOrganizations'),
    createOrganization: makeFunctionReference('organizations:createOrganization'),
  },
  suppliers: {
    listSuppliers: makeFunctionReference('suppliers:listSuppliers'),
    createSupplier: makeFunctionReference('suppliers:createSupplier'),
  },
};

const environment = loadEnv('development', process.cwd(), '');
const backendUrl = environment.VITE_CONVEX_URL;
const endpoint = backendUrl ? new URL(backendUrl) : null;

if (
  !endpoint ||
  endpoint.protocol !== 'http:' ||
  !['localhost', '127.0.0.1', '::1'].includes(endpoint.hostname)
) {
  throw new Error('Local mobilization seed requires VITE_CONVEX_URL to point to this computer.');
}

const client = new ConvexHttpClient(backendUrl);
const organizations = await client.query(api.organizations.listOrganizations, {});
let organization = organizations.find((item) => item.slug === 'local-mobilization-test');

if (!organization) {
  const organizationId = await client.mutation(api.organizations.createOrganization, {
    name: 'Local Mobilization Test Org',
    slug: 'local-mobilization-test',
    email: 'local@example.test',
    phone: '0000000000',
    address: 'Local development',
    currency: 'SAR',
    vat_number: '',
    vat_rate: '15',
    timezone: 'Asia/Riyadh',
    language: 'en',
    profit_sharing_enabled: false,
    profit_sharing_percentage: '0',
  });
  organization = organizations.find((item) => item._id === organizationId);
  if (!organization) {
    const updatedOrganizations = await client.query(api.organizations.listOrganizations, {});
    organization = updatedOrganizations.find((item) => item._id === organizationId);
  }
}

if (!organization) {
  throw new Error('The local test organization could not be created or loaded.');
}

const existingSuppliers = await client.query(api.suppliers.listSuppliers, {
  organization_id: organization._id,
});
const testSuppliers = [
  {
    name: 'CareBridge Medical Services',
    country: 'India',
    service_ids: ['medical', 'gamca'],
  },
  {
    name: 'MediPath Dhaka',
    country: 'Bangladesh',
    service_ids: ['medical', 'gamca'],
  },
  {
    name: 'Global Document Assist',
    country: 'Multi-country',
    service_ids: ['attestation', 'visa-authorization', 'translation-legalization', 'visa', 'pre-departure-orientation', 'post-arrival-documents'],
  },
  {
    name: 'SkyRoute Travel',
    country: 'Multi-country',
    service_ids: ['flight', 'airport-transfer'],
  },
];

for (const supplier of testSuppliers) {
  if (existingSuppliers.some((item) => item.name === supplier.name)) continue;
  await client.mutation(api.suppliers.createSupplier, {
    ...supplier,
    organization_id: organization._id,
  });
}

console.log(`Local mobilization test data is ready for ${organization.name}.`);
