"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createImplicitClient } from "@/lib/supabase/client";

export function InvitationAuthBridge() {
  const router = useRouter();

  useEffect(() => {
    const supabase = (() => {
      try {
        return createImplicitClient();
      } catch {
        return null;
      }
    })();
    if (!supabase) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        router.refresh();
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
