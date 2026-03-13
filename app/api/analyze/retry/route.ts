import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { uploadId } = await req.json();
    if (!uploadId) {
      return NextResponse.json({ error: "Upload ID is required" }, { status: 400 });
    }

    // Verify upload belongs to user
    const upload = await db.upload.findFirst({
      where: {
        id: uploadId,
        userId: session.user.id,
      },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    // Reset status to allow retry
    await db.upload.update({
      where: { id: uploadId },
      data: {
        analysisStatus: "pending",
        errorMessage: null,
      },
    });

    return NextResponse.json({ success: true, uploadId });
  } catch (error) {
    console.error("[RETRY_API_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
