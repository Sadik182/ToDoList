import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getIdFromReq(req: Request, params?: { id?: string }) {
  const resolevedParam = params ? await params : undefined;
  const p = resolevedParam?.id;
  if (p) return p;
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");
    return parts[parts.length - 1] || undefined;
  } catch {
    return undefined;
  }
}

export async function PUT(
  req: Request,
  { params }: { params?: { id?: string } } = {}
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = await getIdFromReq(req, params);
    if (!id) return new NextResponse("Invalid id", { status: 400 });

    // validate ObjectId
    if (!ObjectId.isValid(id))
      return new NextResponse("Invalid ObjectId", { status: 400 });

    const body = await req.json().catch(() => ({}));
    const { text, completed } = body as { text?: string; completed?: boolean };
    const update: any = {};
    if (typeof text === "string") update.text = text;
    if (typeof completed === "boolean") update.completed = completed;

    if (Object.keys(update).length === 0) {
      return new NextResponse("No valid fields to update", { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);
    const col = db.collection("todos");

    // Check if todo belongs to user
    const todo = await col.findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });
    if (!todo) {
      return new NextResponse("Todo not found", { status: 404 });
    }

    // update then fetch the fresh document (works across driver versions)
    await col.updateOne(
      { _id: new ObjectId(id), userId: session.user.id },
      { $set: update }
    );
    const updated = await col.findOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });

    if (!updated) return new NextResponse("Todo not found", { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params?: { id?: string } } = {}
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = await getIdFromReq(req, params);
    if (!id) return new NextResponse("Invalid id", { status: 400 });
    if (!ObjectId.isValid(id))
      return new NextResponse("Invalid ObjectId", { status: 400 });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || undefined);
    const col = db.collection("todos");

    const res = await col.deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id,
    });
    if (res.deletedCount === 0)
      return new NextResponse("Todo not found", { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
