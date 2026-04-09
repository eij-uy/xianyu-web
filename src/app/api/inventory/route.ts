import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql('SELECT * FROM inventory ORDER BY created_at DESC');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, category, stock, capacity } = await request.json();
    
    const restockQty = Math.max(0, capacity - stock);
    let status = 'normal';
    const percent = (stock / capacity) * 100;
    if (percent <= 20) status = 'critical';
    else if (percent <= 40) status = 'low';
    
    const result = await sql`
      INSERT INTO inventory (name, category, stock, capacity, restock_qty, status, created_at)
      VALUES (${name}, ${category || '其他'}, ${stock || 0}, ${capacity || 100}, ${restockQty}, ${status}, NOW())
      RETURNING *
    `;
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to create inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}