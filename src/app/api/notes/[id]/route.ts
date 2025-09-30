import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);
    const note = await db
      .collection("notes")
      .findOne({ _id: new ObjectId(params.id) });

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
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop(); // get last segment as id

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });
    }

    const data = await req.json();
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const updated = await db
      .collection("notes")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: data },
        { returnDocument: "after" }
      );

    if (!updated?.value) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(updated.value);
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
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);

    const result = await db
      .collection("notes")
      .deleteOne({ _id: new ObjectId(params.id) });
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
