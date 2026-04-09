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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await sql<Account[]>`SELECT * FROM accounts WHERE id = ${id}`;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to get account:', error);
    return NextResponse.json({ error: 'Failed to get account' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { nickname, avatar, cookie } = await request.json() as { nickname?: string; avatar?: string; cookie?: string };
    
    await sql`
      UPDATE accounts 
      SET nickname = ${nickname || ''}, 
          avatar = ${avatar || ''},
          cookie = ${cookie || ''}
      WHERE id = ${id}
    `;
    
    const result = await sql<Account[]>`SELECT * FROM accounts WHERE id = ${id}`;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to update account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }
    
    await sql`DELETE FROM accounts WHERE id = ${id}`;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}