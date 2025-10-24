import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);
    const note = await db
      .collection("notes")
      .findOne({ _id: new ObjectId(id), userId: session.user.id });

    if (!note)
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json(note);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // get last segment as id

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const data = await req.json();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);

    // Check if note belongs to user
    const note = await db
      .collection("notes")
      .findOne({ _id: new ObjectId(id), userId: session.user.id });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Update the note
    const updateResult = await db
      .collection("notes")
      .updateOne(
        { _id: new ObjectId(id), userId: session.user.id },
        { $set: data }
      );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Fetch the updated note
    const updated = await db
      .collection("notes")
      .findOne({ _id: new ObjectId(id), userId: session.user.id });

    if (!updated) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);

    const result = await db
      .collection("notes")
      .deleteOne({ _id: new ObjectId(id), userId: session.user.id });
    if (!result.deletedCount)
      return NextResponse.json({ error: "Note not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
