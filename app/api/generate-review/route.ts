import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { storeName, likedItems } = await req.json();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `Write a short, 2-sentence Google review for ${storeName}. 
                  The customer liked: ${likedItems}. Make it sound like a happy local.`;

  const result = await model.generateContent(prompt);
  return NextResponse.json({ draft: result.response.text() });
}