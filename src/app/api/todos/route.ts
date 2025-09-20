import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || undefined);
  const col = db.collection("todos");
  const todos = await col.find({}).sort({ createdAt: -1 }).toArray();
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { text } = body;
  if (!text || typeof text !== "string")
    return new NextResponse(JSON.stringify({ error: "Missing text" }), {
      status: 400,
    });

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || undefined);
  const col = db.collection("todos");
  const doc = { text, completed: false, createdAt: new Date() };
  const result = await col.insertOne(doc);
  const inserted = await col.findOne({ _id: result.insertedId });
  return NextResponse.json(inserted, { status: 201 });
}
