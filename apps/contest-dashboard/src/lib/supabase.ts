import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

// Dùng service key nếu có (cho admin ops), không thì dùng anon key
export const supabase = createClient(
	supabaseUrl,
	supabaseServiceKey || supabaseAnonKey,
);
