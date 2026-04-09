import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql('SELECT * FROM accounts ORDER BY created_at DESC');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cookie, nickname, account_id, avatar } = await request.json();
    
    const result = await sql`
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