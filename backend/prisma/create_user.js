import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Saumit@07', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'saumitbehera07@gmail.com' },
    update: { password: hashedPassword },
    create: {
      full_name: 'Saumit Behera',
      email: 'saumitbehera07@gmail.com',
      password: hashedPassword,
      role: 'USER',
    },
  });

  // Seed sample budget records for this user
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    await prisma.budget.upsert({
      where: {
        user_id_category_id: {
          user_id: user.user_id,
          category_id: cat.category_id,
        }
      },
      update: {},
      create: {
        user_id: user.user_id,
        category_id: cat.category_id,
        monthly_limit: cat.category_name === 'Food' ? 12000 : 8000,
      }
    });
  }

  // Copy historical expenses from demo user if empty
  const demoUser = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
  if (demoUser) {
    const demoExpenses = await prisma.expense.findMany({ where: { user_id: demoUser.user_id } });
    const count = await prisma.expense.count({ where: { user_id: user.user_id } });
    
    if (count === 0) {
      console.log(`Copying ${demoExpenses.length} transactions to user ${user.email}...`);
      const expensesToInsert = demoExpenses.map(e => ({
        user_id: user.user_id,
        category_id: e.category_id,
        amount: e.amount,
        payment_method: e.payment_method,
        description: e.description,
        expense_date: e.expense_date,
      }));

      const chunkSize = 200;
      for (let i = 0; i < expensesToInsert.length; i += chunkSize) {
        await prisma.expense.createMany({
          data: expensesToInsert.slice(i, i + chunkSize)
        });
      }
      console.log('Historical expenses successfully cloned!');
    }
  }

  // Seed a welcome notification
  await prisma.notification.create({
    data: {
      user_id: user.user_id,
      title: 'Welcome, Saumit!',
      message: 'Your personal finance dashboard has been successfully activated with cloned historical records.',
    }
  });

  console.log('Successfully configured user:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
