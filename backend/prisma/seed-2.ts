// ── Supplier org + user (for supplier portal demo) ────────────────
const supplierOrg = await prisma.organization.upsert({
  where: { code: 'SOLARTECH' },
  update: {},
  create: {
    code: 'SOLARTECH',
    name: 'SolarTech Ethiopia PLC',
    orgType: 'SUPPLIER',
    level: 'FEDERAL'
  }
});

await prisma.supplier.updateMany({
  where: { tin: 'TIN-0000001' },
  data: { orgId: supplierOrg.orgId }
});

const supplierUser = await prisma.user.upsert({
  where: { username: 'sp.admin' },
  update: {},
  create: {
    username: 'sp.admin',
    email: 'sp.admin@solartech.et',
    fullName: 'SolarTech Admin',
    orgId: supplierOrg.orgId,
    roleId: roles['SP-AD']!,
    passwordHash: password,
    status: 'ACTIVE'
  }
});
console.log(`  ✓ Supplier org + user (${supplierUser.username})`);