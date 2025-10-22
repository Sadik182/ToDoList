import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

// GET api for fetching all todos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);
    const col = db.collection("todos");
    const todos = await col
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST api for creating a new todo
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, date } = body;
    if (!text || typeof text !== "string")
      return new NextResponse(JSON.stringify({ error: "Missing text" }), {
        status: 400,
      });
    if (!date || typeof date !== "string")
      return new NextResponse(JSON.stringify({ error: "Missing date" }), {
        status: 400,
      });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);
    const col = db.collection("todos");
    const doc = {
      text,
      date,
      completed: false,
      userId: session.user.id,
      createdAt: new Date(),
    };
    const result = await col.insertOne(doc);
    const inserted = await col.findOne({ _id: result.insertedId });
    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error("Error creating todo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
