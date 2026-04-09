import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

interface Good {
  id: number;
  account_id: number;
  xianyu_id: string;
  title: string;
  price: number;
  image: string;
  status: number;
  created_at: string;
  update_time: string;
}

interface CreateGoodInput {
  account_id: number;
  xianyu_id: string;
  title: string;
  price: number;
  image: string;
  status: number;
}

export async function POST(request: NextRequest) {
    try {
        const { account_id, xianyu_id, title, price, image, status } = await request.json() as CreateGoodInput;

        const result = await sql<Good[]>`
      INSERT INTO xianyu_goods (account_id, xianyu_id, title, price, image, status)
      VALUES (${account_id}, ${xianyu_id}, ${title}, ${price}, ${image}, ${status})
      RETURNING *
    `;

        return NextResponse.json(result[0]);
    } catch (err) {
        console.log("err", err)
        return NextResponse.json({ error: "创建失败" }, { status: 500 });
    }
}
