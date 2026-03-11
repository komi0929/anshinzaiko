import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Check if user already has a store
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: admin } = await supabase
            .from("store_admins")
            .select("store_id")
            .eq("user_id", user.id)
            .single();

          // If no store exists, create one (first-time Google login)
          if (!admin) {
            const token =
              crypto.randomUUID().replace(/-/g, "") +
              crypto.randomUUID().replace(/-/g, "");

            const displayName =
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "マイ店舗";

            const { data: store, error: storeError } = await supabase
              .from("stores")
              .insert({
                name: `${displayName}のお店`,
                staff_token: token,
              })
              .select()
              .single();

            if (!storeError && store) {
              await supabase.from("store_admins").insert({
                store_id: store.id,
                user_id: user.id,
              });

              // Create default locations
              const defaultLocations = [
                "冷蔵庫A",
                "冷蔵庫B",
                "冷凍庫",
                "乾物棚",
                "その他",
              ];
              for (let i = 0; i < defaultLocations.length; i++) {
                await supabase.from("locations").insert({
                  store_id: store.id,
                  name: defaultLocations[i],
                  sort_order: i,
                });
              }
            }
          }
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${next}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`);
        } else {
          return NextResponse.redirect(`${origin}${next}`);
        }
      }
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
