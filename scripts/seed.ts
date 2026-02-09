import { prisma } from '@agentops/db';
import { faker } from '@faker-js/faker';

async function main() {
  await prisma.message.deleteMany({});
  await prisma.agentRun.deleteMany({});
  await prisma.toolCall.deleteMany({});
  await prisma.ingestEvent.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.evalRun.deleteMany({});
  await prisma.evalSuite.deleteMany({});
  await prisma.guardrailViolation.deleteMany({});
  await prisma.incident.deleteMany({});

  const conversations = await prisma.conversation.createManyAndReturn({
    data: Array.from({ length: 20 }).map(() => ({
      title: faker.company.catchPhrase(),
    })),
  });

  for (const convo of conversations) {
    const messageCount = faker.number.int({ min: 5, max: 15 });
    for (let i = 0; i < messageCount; i += 1) {
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: faker.lorem.sentence(),
        },
      });
    }

    const run = await prisma.agentRun.create({
      data: {
        conversationId: convo.id,
        status: 'succeeded',
        latencyMs: faker.number.int({ min: 50, max: 500 }),
      },
    });

    await prisma.toolCall.create({
      data: {
        agentRunId: run.id,
        tool: faker.helpers.arrayElement(['check_availability', 'book_appointment', 'create_ticket']),
        status: 'succeeded',
        request: {},
        response: { ok: true },
        latencyMs: faker.number.int({ min: 30, max: 200 }),
      },
    });
  }

  await prisma.evalSuite.create({
    data: {
      name: 'goldens',
      version: 'v1',
      runs: {
        create: Array.from({ length: 10 }).map(() => ({
          status: faker.helpers.arrayElement(['passed', 'failed']),
          passRate: faker.number.float({ min: 0.6, max: 1.0, precision: 0.01 }),
        })),
      },
    },
  });

  await prisma.guardrailViolation.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      type: 'PII_EMAIL',
      severity: faker.helpers.arrayElement(['low', 'medium', 'high']),
      detail: faker.lorem.sentence(),
    })),
  });

  await prisma.incident.createMany({
    data: ['tool_latency_spike', 'redis_down', 'traffic_spike'].map((type) => ({
      type,
      status: 'completed',
    })),
  });

  console.log('Seed complete');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
