import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  const { image, mimeType } = await req.json();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this receipt image for a business named "The Local Spot".
    1. Confirm if the receipt is from "The Local Spot".
    2. Extract the Date and Total Amount.
    3. If valid and from today (April 5, 2026), respond with "VALID" followed by the total. 
    4. If not, explain why.
  `;

  // Gemini expects images as base64 data in this specific structure
  const result = await model.generateContent([
    prompt,
    { inlineData: { data: image, mimeType } }
  ]);

  return NextResponse.json({ analysis: result.response.text() });
}