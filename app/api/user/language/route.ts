import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    const { language } = await req.json();

    if (!language) {
      return NextResponse.json(
        { success: false, error: "Language is required" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { language },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API_USER_LANGUAGE]", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
