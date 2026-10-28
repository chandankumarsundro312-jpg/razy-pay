import { createClient } from '@supabase/supabase-js';

// Safely read Vite environment variables if running in browser
const getBrowserEnv = (key: string): string | undefined => {
  try {
    const metaEnv = (Function('return import.meta.env') as any)();
    return metaEnv ? metaEnv[key] : undefined;
  } catch {
    return undefined;
  }
};

const envProjectId = (typeof process !== 'undefined' && process.env?.SUPABASE_PROJECT_ID) ||
  getBrowserEnv('VITE_SUPABASE_PROJECT_ID') ||
  'fwhsgsdqqexytpsyfqfm';

const envUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  getBrowserEnv('VITE_SUPABASE_URL') ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  `https://${envProjectId}.supabase.co`;

const envKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) ||
  getBrowserEnv('VITE_SUPABASE_ANON_KEY') ||
  getBrowserEnv('VITE_SUPABASE_KEY') ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  'sb_publishable_avbit2qwpbQFtzUxf491QA_2_qJziv1';

export const SUPABASE_PROJECT_ID = envProjectId;
export const SUPABASE_URL = envUrl;
export const SUPABASE_ANON_KEY = envKey;
export const SUPABASE_KEY = envKey;

// Create Supabase client singleton
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

/**
 * Health check utility to test Supabase connection
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; details?: any }> {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      return { ok: false, message: error.message, details: error };
    }
    return { ok: true, message: 'Connected to Supabase successfully' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Connection failure' };
  }
}

export interface SupabaseRegistrationPayload {
  user_id: string;
  mobile: string;
  email?: string;
  full_name: string;
  referral_code?: string;
  role?: string;
  account_status?: string;
  kyc_status?: string;
  raw_password?: string;
  created_at: string;
}

/**
 * Saves user registration details to Supabase backend table 'users' / 'registrations'
 */
export async function saveUserToSupabase(user: {
  id: string;
  mobile: string;
  email?: string;
  fullName: string;
  referralCode?: string;
  role?: string;
  accountStatus?: string;
  kycStatus?: string;
  password?: string;
  createdAt?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const payload: SupabaseRegistrationPayload = {
      user_id: user.id,
      mobile: user.mobile,
      email: user.email,
      full_name: user.fullName,
      referral_code: user.referralCode,
      role: user.role || 'user',
      account_status: user.accountStatus || 'active',
      kyc_status: user.kycStatus || 'pending',
      created_at: user.createdAt || new Date().toISOString()
    };

    // Try inserting into 'users' table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'mobile' });

    if (!usersError) {
      console.log(`[Supabase] Successfully saved user ${user.mobile} to 'users' table`);
      return { success: true, data: usersData };
    }

    console.warn(`[Supabase] Note on 'users' table: ${usersError.message}, trying 'registrations'...`);

    // Fallback/secondary attempt into 'registrations' or 'profiles' table
    const { data: regData, error: regError } = await supabase
      .from('registrations')
      .upsert(payload, { onConflict: 'mobile' });

    if (!regError) {
      console.log(`[Supabase] Successfully saved user ${user.mobile} to 'registrations' table`);
      return { success: true, data: regData };
    }

    console.warn(`[Supabase] Supabase table insert note: ${regError.message}`);
    return { success: false, error: regError.message };
  } catch (err: any) {
    console.error(`[Supabase] Sync error:`, err?.message || err);
    return { success: false, error: err?.message || 'Failed to sync to Supabase' };
  }
}
