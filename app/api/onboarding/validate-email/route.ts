import { NextResponse } from "next/server";
import { validateWorkEmail } from "@/lib/onboarding/email";

export async function POST(request: Request) {
  let email = "";

  try {
    const body: unknown = await request.json();
    if (typeof body === "object" && body !== null && "email" in body) {
      email = String(body.email ?? "");
    }
  } catch {
    return NextResponse.json({ valid: false, normalized: "" }, { status: 400 });
  }

  const result = validateWorkEmail(email);
  return NextResponse.json(result, { status: result.valid ? 200 : 422 });
}
