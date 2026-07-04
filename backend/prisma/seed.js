import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultCategories = [
  { category_name: 'Food', icon: 'Utensils', color: '#EF4444' },
  { category_name: 'Transport', icon: 'Car', color: '#3B82F6' },
  { category_name: 'Shopping', icon: 'ShoppingBag', color: '#EC4899' },
  { category_name: 'Entertainment', icon: 'Film', color: '#8B5CF6' },
  { category_name: 'Medical', icon: 'HeartPulse', color: '#10B981' },
  { category_name: 'Education', icon: 'GraduationCap', color: '#F59E0B' },
  { category_name: 'Travel', icon: 'Plane', color: '#06B6D4' },
  { category_name: 'Bills', icon: 'FileText', color: '#6B7280' },
  { category_name: 'Rent', icon: 'Home', color: '#6366F1' },
  { category_name: 'Salary', icon: 'Briefcase', color: '#10B981' },
  { category_name: 'Investment', icon: 'TrendingUp', color: '#10B981' },
  { category_name: 'Others', icon: 'Grid', color: '#9CA3AF' }
];

async function main() {
  console.log('Seeding database...');

  // 1. Seed Categories
  const categoryMap = new Map();
  for (const cat of defaultCategories) {
    const upserted = await prisma.category.upsert({
      where: { category_name: cat.category_name },
      update: {},
      create: cat,
    });
    categoryMap.set(cat.category_name, upserted.category_id);
  }
  console.log(`Seeded ${defaultCategories.length} categories.`);

  // 2. Create Demo User
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      full_name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
      role: 'USER',
    },
  });
  console.log(`Demo user created: ${demoUser.email}`);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      full_name: 'System Admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Admin user created: ${adminUser.email}`);

  // 3. Create Sample Budgets for Demo User
  const budgetLimits = [
    { name: 'Food', limit: 12000 },
    { name: 'Transport', limit: 3000 },
    { name: 'Shopping', limit: 8000 },
    { name: 'Entertainment', limit: 5000 },
    { name: 'Bills', limit: 8000 },
    { name: 'Rent', limit: 16000 },
  ];

  for (const budget of budgetLimits) {
    const categoryId = categoryMap.get(budget.name);
    if (categoryId) {
      await prisma.budget.upsert({
        where: {
          user_id_category_id: {
            user_id: demoUser.user_id,
            category_id: categoryId,
          }
        },
        update: { monthly_limit: budget.limit },
        create: {
          user_id: demoUser.user_id,
          category_id: categoryId,
          monthly_limit: budget.limit,
        }
      });
    }
  }
  console.log('Sample budgets seeded for Demo User.');

  // 4. Seed Expenses from CSV
  const csvPath = path.join(__dirname, '../../ai-service/datasets/sample_expenses.csv');
  if (fs.existsSync(csvPath)) {
    console.log('Reading sample expenses CSV...');
    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n');
    
    // Check if user already has expenses to prevent double-seeding
    const count = await prisma.expense.count({ where: { user_id: demoUser.user_id } });
    if (count > 0) {
      console.log(`Demo user already has ${count} expenses. Skipping CSV ingestion.`);
      return;
    }

    const expensesToInsert = [];
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple parser (handles simple values since our generator output is controlled)
      const parts = line.split(',');
      if (parts.length < 4) continue;
      
      const dateStr = parts[0];
      const categoryName = parts[1];
      const amount = parseFloat(parts[2]);
      const paymentMethod = parts[3];
      const description = parts[4] || '';
      
      const categoryId = categoryMap.get(categoryName) || categoryMap.get('Others');
      
      expensesToInsert.push({
        user_id: demoUser.user_id,
        category_id: categoryId,
        amount: amount,
        payment_method: paymentMethod,
        description: description.replace(/"/g, ''),
        expense_date: new Date(dateStr),
      });
    }

    if (expensesToInsert.length > 0) {
      console.log(`Inserting ${expensesToInsert.length} historical expenses for Demo User...`);
      // Chunk insertions due to prisma size limits
      const chunkSize = 200;
      for (let i = 0; i < expensesToInsert.length; i += chunkSize) {
        const chunk = expensesToInsert.slice(i, i + chunkSize);
        await prisma.expense.createMany({
          data: chunk
        });
      }
      console.log('Historical expenses successfully seeded!');
    }
  } else {
    console.log('Sample expenses CSV not found at:', csvPath);
  }

  // 5. Seed some notifications
  await prisma.notification.createMany({
    data: [
      {
        user_id: demoUser.user_id,
        title: 'Welcome to Expenix!',
        message: 'Your demo account is fully set up with 14 months of transaction records. Check the AI Prediction page to train your first forecasting model!',
        read_status: false,
      },
      {
        user_id: demoUser.user_id,
        title: 'Budget Alert',
        message: 'You have utilized 92% of your monthly Food budget. Consider reducing dining out expenses.',
        read_status: false,
      }
    ]
  });
  console.log('Initial notifications seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
