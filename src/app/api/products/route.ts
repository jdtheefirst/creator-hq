// src/app/api/products/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const {
      name,
      description,
      price,
      type,
      status,
      slug,
      thumbnail_url,
      affiliate_url,
      digital_file_url,
      stock_quantity,
      creator_id,
    } = await request.json();

    // Validate required fields
    if (!name || !price || !type || !slug || !creator_id) {
      return NextResponse.json(
        { error: "Name, price, type, slug, and creator_id are required" },
        { status: 400 }
      );
    }

    // Insert new product
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          description,
          price,
          type,
          status,
          slug,
          thumbnail_url,
          affiliate_url,
          digital_file_url,
          stock_quantity,
          creator_id,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "published");

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Product fetching error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
