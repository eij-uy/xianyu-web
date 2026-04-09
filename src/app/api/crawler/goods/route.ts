import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

function runPython(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const cwd = process.cwd();
    console.log('Working directory:', cwd);
    
    const proc = spawn('python', ['scripts/inventory_demo.py', ...args], {
      cwd: cwd,
      windowsHide: true,
      env: { ...process.env }
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    
    proc.on('close', (code) => {
      console.log('Code:', code);
      console.log('Stdout len:', stdout.length, 'Stderr:', stderr.slice(0, 500));
      
      if (stdout.trim()) {
        try { resolve(JSON.parse(stdout.trim())); } 
        catch { resolve({ error: '解析失败', raw: stdout.slice(0, 100) }); }
      } else {
        resolve({ error: stderr || '无输出', code });
      }
    });
    proc.on('error', (e) => resolve({ error: e.message }));
  });
}

export async function GET(request: NextRequest) {
  const cookie = request.nextUrl.searchParams.get('cookie');
  const page = request.nextUrl.searchParams.get('page') || '1';
  const limit = request.nextUrl.searchParams.get('limit') || '20';
  
  console.log('=== API Called ===');
  console.log('Cookie length from URL:', cookie?.length);
  console.log('Cookie has _m_h5_tk:', cookie?.includes('_m_h5_tk'));
  
  const result = await runPython(['page_data', cookie || 'test', page, limit]);
  console.log('Result:', result ? JSON.stringify(result).slice(0, 500) : 'empty');
  
  return NextResponse.json(result);
}