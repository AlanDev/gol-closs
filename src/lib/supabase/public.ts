import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Cliente anónimo sin cookies (cacheable). Respeta RLS y los grants por columna. */
export function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
