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
  '';

const envUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  getBrowserEnv('VITE_SUPABASE_URL') ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (envProjectId ? `https://${envProjectId}.supabase.co` : '');

const envKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_KEY) ||
  getBrowserEnv('VITE_SUPABASE_ANON_KEY') ||
  getBrowserEnv('VITE_SUPABASE_KEY') ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured = (): boolean => {
  if (!envUrl || !envKey) return false;
  // Ignore dummy/placeholder strings that fail DNS resolution
  if (
    envProjectId === 'fwhsgsdqqexytpsyfqfm' ||
    envUrl.includes('fwhsgsdqqexytpsyfqfm') ||
    envKey.includes('sb_publishable_avbit2qwpbQFtzUxf491QA_2_qJziv1') ||
    envUrl.includes('placeholder') ||
    envKey.includes('placeholder')
  ) {
    return false;
  }
  return true;
};

export const SUPABASE_PROJECT_ID = envProjectId;
export const SUPABASE_URL = envUrl;
export const SUPABASE_ANON_KEY = envKey;
export const SUPABASE_KEY = envKey;

// Create Supabase client singleton only when properly configured
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

/**
 * Health check utility to test Supabase connection
 */
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string; details?: any }> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, message: 'Supabase is optional and currently unconfigured. Cloud Firestore is the active database.' };
  }
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
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
  // If Supabase is not configured with real live credentials, gracefully skip
  if (!isSupabaseConfigured() || !supabase) {
    return { success: true, data: null };
  }

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
      return { success: true, data: usersData };
    }

    // Fallback/secondary attempt into 'registrations' or 'profiles' table
    const { data: regData, error: regError } = await supabase
      .from('registrations')
      .upsert(payload, { onConflict: 'mobile' });

    if (!regError) {
      return { success: true, data: regData };
    }

    return { success: false, error: regError.message };
  } catch (err: any) {
    // Graceful error handling without throwing or spamming logs
    return { success: false, error: err?.message || 'Failed to sync to Supabase' };
  }
}
