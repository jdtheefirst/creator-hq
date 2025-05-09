import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: any) {
  const { id } = context.params as { id: string };

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Product fetching error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = context.params as { id: string };
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
    } = await request.json();

    // Update product
    const { data, error } = await supabase
      .from("products")
      .update({
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
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { id } = context.params as { id: string };
  const supabase = await createClient();

  try {
    //delete product
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
