import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ValuationRequest = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  message?: string;
  sourcePage?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured yet." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as ValuationRequest;
  const email = body.email?.trim();
  const propertyAddress = body.address?.trim();

  if (!email || !propertyAddress) {
    return NextResponse.json(
      { error: "Email and property address are required." },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.from("lead_submissions").insert({
    lead_type: "valuation",
    full_name: body.name?.trim() || null,
    email,
    phone: body.phone?.trim() || null,
    property_address: propertyAddress,
    message: body.message?.trim() || null,
    source_page: body.sourcePage?.trim() || "home"
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
