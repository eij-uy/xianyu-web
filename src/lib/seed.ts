import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_crKa0uZYB6Dp@ep-solitary-brook-a16swhh1-pooler.ap-southeast-1.aws.neon.tech/xianyu?sslmode=require&channel_binding=require';

async function seed() {
  const sql = neon(DATABASE_URL);
  
  console.log('Seeding accounts...');
  await sql`
    INSERT INTO accounts (cookie, nickname, account_id, created_at, today_gmv, today_orders, today_refunds, total_gmv, total_orders, products)
    VALUES 
      ('cookie_xxx_123456', '数码达人小王', 'wang3C', '2024-01-10', 15680, 8, 1, 128450, 156, 23),
      ('cookie_yyy_789012', '苹果二手专营', 'apple88', '2024-01-08', 23450, 12, 0, 89200, 98, 15),
      ('cookie_zzz_345678', '数码潮玩店', 'digital66', '2024-01-15', 8900, 5, 1, 45600, 67, 18),
      ('cookie_aaa_901234', '笔记本专家', 'laptop2024', '2024-01-20', 31200, 15, 2, 156800, 234, 32)
  `;
  
  console.log('Seeding inventory...');
  await sql`
    INSERT INTO inventory (name, category, stock, capacity, restock_qty, status, created_at)
    VALUES 
      ('iPhone 15 Pro Max', '手机', 45, 100, 55, 'normal', '2024-01-10'),
      ('iPhone 15 Pro', '手机', 12, 80, 68, 'low', '2024-01-10'),
      ('MacBook Pro 14"', '电脑', 8, 30, 22, 'critical', '2024-01-10'),
      ('AirPods Pro 2', '配件', 156, 200, 44, 'normal', '2024-01-10'),
      ('iPad Air M2', '平板', 28, 50, 22, 'normal', '2024-01-10'),
      ('Apple Watch S9', '穿戴', 5, 40, 35, 'critical', '2024-01-10'),
      ('iPhone 15', '手机', 20, 60, 40, 'normal', '2024-01-10'),
      ('iPad Pro 12.9', '平板', 15, 40, 25, 'low', '2024-01-10'),
      ('AirPods Max', '配件', 30, 50, 20, 'normal', '2024-01-10'),
      ('MacBook Air M3', '电脑', 10, 25, 15, 'low', '2024-01-10'),
      ('Apple Pencil', '配件', 80, 100, 20, 'normal', '2024-01-10'),
      ('iPhone 14 Pro', '手机', 3, 50, 47, 'critical', '2024-01-10'),
      ('iPad mini 6', '平板', 18, 30, 12, 'normal', '2024-01-10'),
      ('AirPods 3', '配件', 120, 150, 30, 'normal', '2024-01-10'),
      ('Magic Keyboard', '配件', 25, 40, 15, 'normal', '2024-01-10')
  `;
  
  console.log('Seed completed!');
}

seed().catch(console.error);