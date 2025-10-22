import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);
    const notes = await db
      .collection("notes")
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(notes);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { title, content, date, stage } = data;

    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);

    const result = await db.collection("notes").insertOne({
      title,
      content,
      date,
      stage,
      userId: session.user.id,
      createdAt: new Date(),
    });

    const newNote = await db
      .collection("notes")
      .findOne({ _id: result.insertedId });

    return NextResponse.json(newNote);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
