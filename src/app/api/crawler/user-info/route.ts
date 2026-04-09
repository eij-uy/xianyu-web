import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { spawn } from 'child_process';

function runPython(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', ['scripts/inventory_demo.py', ...args]);
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    
    proc.on('close', (code) => {
      console.log('Python code:', code);
      console.log('Python stdout:', stdout);
      console.log('Python stderr:', stderr);
      
      if (code === 0 && stdout.trim()) {
        try { resolve(JSON.parse(stdout.trim())); } 
        catch { reject(new Error('解析失败: ' + stdout)); }
      } else {
        reject(new Error(stderr || 'Python错误: ' + code));
      }
    });
    proc.on('error', reject);
  });
}

export async function GET(request: NextRequest) {
  try {
    const cookie = request.nextUrl.searchParams.get('cookie');
    const accounts = await sql('SELECT cookie FROM accounts LIMIT 1');
    const finalCookie = cookie || accounts[0]?.cookie;
    
    if (!finalCookie) {
      return NextResponse.json({ error: '未找到Cookie' }, { status: 400 });
    }
    
    const result = await runPython(['user_info', finalCookie]);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : '失败' }, { status: 500 });
  }
}