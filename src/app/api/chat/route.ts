import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();
    
    const inventory = await sql('SELECT * FROM inventory ORDER BY created_at DESC');
    const accounts = await sql('SELECT * FROM accounts ORDER BY created_at DESC');
    
    const inventorySummary = inventory.map(item => ({
      name: item.name,
      category: item.category,
      stock: item.stock,
      capacity: item.capacity,
      status: item.status,
      restock_qty: item.restock_qty
    }));
    
    const accountsSummary = accounts.map(acc => ({
      nickname: acc.nickname,
      today_gmv: acc.today_gmv,
      today_orders: acc.today_orders,
      total_gmv: acc.total_gmv,
      products: acc.products
    }));
    
    const totalStock = inventory.reduce((sum, item) => sum + item.stock, 0);
    const totalCapacity = inventory.reduce((sum, item) => sum + item.capacity, 0);
    const lowStockItems = inventory.filter(item => item.status === 'low' || item.status === 'critical');
    
    const context = `
当前数据库中的库存信息：
- 总商品种类：${inventory.length}种
- 总库存数量：${totalStock}件
- 总容量：${totalCapacity}件
- 使用率：${Math.round((totalStock / totalCapacity) * 100)}%
- 库存预警商品：${lowStockItems.map(i => i.name).join('、') || '无'}

商品详情：
${inventorySummary.map(i => `- ${i.name}（${i.category}）：库存${i.stock}/${i.capacity}件，状态${i.status}，需补货${i.restock_qty}件`).join('\n')}

闲鱼账号数据：
${accountsSummary.map(a => `- ${a.nickname}：今日GMV ¥${a.today_gmv}，今日订单${a.today_orders}单，总GMV ¥${a.total_gmv}，在售宝贝${a.products}个`).join('\n')}

请根据以上数据库中的真实数据回答用户问题。如果用户问的是库存相关问题，请使用上述真实数据。
`;
    
    const API_KEY = process.env.DOUBAO_API_KEY;
    
    if (!API_KEY) {
      return NextResponse.json({ 
        error: 'API Key 未配置' 
      }, { status: 500 });
    }
    
    const client = new OpenAI({
      apiKey: API_KEY,
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      defaultQuery: { 'api_version': 'v3' }
    });
    
    const chatHistory = history?.map((msg: { role: string; content: string }) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })) || [];
    
    const stream = await client.chat.completions.create({
      model: 'deepseek-v3-2-251201',
      messages: [
        {
          role: 'system',
          content: `你是"一禾"，一禾二手机供应链批发平台的智能助手。你的角色设定：

1. 身份：你是一禾的员工，熟悉公司所有业务流程
2. 性格：专业、热情、亲切，善于用简洁的语言解答问题
3. 职责：
   - 帮助用户查询库存情况（哪些商品库存不足、需要补货）
   - 分析销售数据（GMV、订单量、账号表现）
   - 提供采购建议和业务分析
4. 回答风格：简洁、专业、用 emoji 增加亲和力
5. 你只能基于提供的数据库真实数据回答，不要编造信息

当前数据库中的真实数据：
${context}`
        },
        ...chatHistory,
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: true
    });
    
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      }
    });
    
    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '服务器错误' 
    }, { status: 500 });
  }
}