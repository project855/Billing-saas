const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const list = await prisma.customer.findMany();
    console.log('Customer count:', list.length);
  } catch (err) {
    console.error('Error fetching customers:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
