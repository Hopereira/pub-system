const { Client } = require('pg');
const client = new Client({ 
  connectionString: process.env.DATABASE_URL 
});

async function check() {
  await client.connect();
  
  const semTenant = await client.query('SELECT COUNT(*) as total, status FROM comandas WHERE tenant_id IS NULL GROUP BY status');
  console.log('Comandas SEM tenant_id:', semTenant.rows);
  
  const comTenant = await client.query('SELECT COUNT(*) as total, tenant_id, status FROM comandas WHERE tenant_id IS NOT NULL GROUP BY tenant_id, status');
  console.log('Comandas COM tenant_id:', comTenant.rows);
  
  const tenant = await client.query("SELECT id, slug FROM empresas WHERE slug LIKE '%casarao%'");
  console.log('Tenant Casarao:', tenant.rows);
  
  await client.end();
}

check().catch(console.error);
