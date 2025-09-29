import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; // your MongoDB connection

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("notesDb");
    const notes = await db
      .collection("notes")
      .find({})
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
    const data = await req.json();
    const { title, content, date, stage } = data;

    if (!title)
      return NextResponse.json({ error: "Title required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("notesDb");

    const result = await db.collection("notes").insertOne({
      title,
      content,
      date,
      stage,
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
