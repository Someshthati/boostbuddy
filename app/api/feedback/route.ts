import { NextResponse } from "next/server";
// In the future, you'll connect this to Supabase/Prisma
export async function POST(req: Request) {
  const body = await req.json();
  
  // LOGIC: Save body.complaint and body.customerContact to your database
  console.log("Negative feedback intercepted:", body);

  return NextResponse.json({ message: "Feedback sent to manager." });
}