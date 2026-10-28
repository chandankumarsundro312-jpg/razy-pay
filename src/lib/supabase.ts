import { createClient } from '@supabase/supabase-js';

// Supabase configuration details provided by user
export const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'fwhsgsdqqexytpsyfqfm';
export const SUPABASE_URL = process.env.SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_avbit2qwpbQFtzUxf491QA_2_qJziv1';

// Create Supabase client singleton
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

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
