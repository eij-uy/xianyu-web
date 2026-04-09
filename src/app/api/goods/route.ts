import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const { account_id, xianyu_id, title, price, image, status } = await request.json();

        const result = await sql`
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
