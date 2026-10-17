// ── Notification templates ──────────────────────────────────────
import { TEMPLATE_CATALOGUE } from '../src/modules/notifications/notification.templates.js';

for (const tpl of TEMPLATE_CATALOGUE) {
  await prisma.notificationTemplate.upsert({
    where: { code: tpl.code },
    update: {
      name: tpl.name,
      description: tpl.description,
      channel: tpl.channels[0],
      subject: tpl.subject,
      body: tpl.body,
      language: 'en'
    },
    create: {
      code: tpl.code,
      name: tpl.name,
      description: tpl.description,
      channel: tpl.channels[0],
      subject: tpl.subject,
      body: tpl.body,
      language: 'en',
      active: true
    }
  });
}
console.log(`  ✓ ${TEMPLATE_CATALOGUE.length} notification templates`);