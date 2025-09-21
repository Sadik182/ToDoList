import { NextResponse } from "next/server";
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

  // update then fetch the fresh document (works across driver versions)
  await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
  const updated = await col.findOne({ _id: new ObjectId(id) });

  if (!updated) return new NextResponse("Todo not found", { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params?: { id?: string } } = {}
) {
  const id = getIdFromReq(req, params);
  if (!id) return new NextResponse("Invalid id", { status: 400 });
  if (!ObjectId.isValid(id))
    return new NextResponse("Invalid ObjectId", { status: 400 });

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || undefined);
  const col = db.collection("todos");

  const res = await col.deleteOne({ _id: new ObjectId(id) });
  if (res.deletedCount === 0)
    return new NextResponse("Todo not found", { status: 404 });
  return new NextResponse(null, { status: 204 });
}
