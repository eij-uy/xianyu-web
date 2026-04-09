import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

interface Account {
  id: number;
  cookie: string;
  nickname: string;
  account_id: string;
  avatar: string;
  products: number;
  created_at: string;
  today_gmv: number;
  today_orders: number;
  today_refunds: number;
  total_gmv: number;
  total_orders: number;
}

export async function GET() {
  try {
    const result = await sql<Account[]>`SELECT * FROM accounts ORDER BY created_at DESC`;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cookie, nickname, account_id, avatar } = await request.json() as { cookie: string; nickname?: string; account_id?: string; avatar?: string };
    
    const result = await sql<Account[]>`
      INSERT INTO accounts (cookie, nickname, account_id, avatar, created_at, today_gmv, today_orders, today_refunds, total_gmv, total_orders, products)
      VALUES (${cookie}, ${nickname || ''}, ${account_id || ''}, ${avatar || ''}, NOW(), 0, 0, 0, 0, 0, 0)
      RETURNING *
    `;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}