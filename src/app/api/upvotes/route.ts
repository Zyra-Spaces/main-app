import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user");
  const supabase = await createClient();

  if (userId) {
    const { data, error } = await supabase
      .from("upvotes")
      .select("project_id")
      .eq("user_id", userId);
    if (error) {
      return NextResponse.json({ error: "Failed to fetch upvotes" }, { status: 500 });
    }
    return NextResponse.json({ data: data ?? [] });
  }

  const { data, error } = await supabase.from("upvotes").select("project_id");
  if (error) {
    return NextResponse.json({ error: "Failed to fetch upvotes" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
