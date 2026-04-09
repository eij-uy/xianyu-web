import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goods = await sql`
      SELECT * FROM xianyu_goods WHERE account_id = ${id} ORDER BY created_at DESC
    `;
    return NextResponse.json(goods);
  } catch (err) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, xianyu_id } = await request.json();
    
    await sql`
      UPDATE xianyu_goods 
      SET status = ${status}, update_time = NOW() 
      WHERE account_id = ${id} AND xianyu_id = ${xianyu_id}
    `;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.log("[PUI] goods/[id] err", err)
    return NextResponse.json({ error: '更新失败' }, { status: 500 });
  }
}