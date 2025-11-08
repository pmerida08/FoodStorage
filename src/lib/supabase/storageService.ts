import { supabase } from './client';
import type { Database } from './types';

type StorageItem = Database['public']['Tables']['storage_items']['Row'];
type StorageLocation = Database['public']['Tables']['storage_locations']['Row'];
type StorageItemInsert = Database['public']['Tables']['storage_items']['Insert'];

const DEFAULT_LOCATIONS = [
  { name: 'Freezer', type: 'freezer' },
  { name: 'Fridge', type: 'fridge' },
  { name: 'Larder', type: 'larder' },
];

/**
 * Initialize default storage locations for a user if they don't exist
 */
export async function initializeStorageLocations(userId: string) {
  // Check if user already has storage locations
  const { data: existing, error: checkError } = await supabase
    .from('storage_locations')
    .select('type')
    .eq('user_id', userId);

  if (checkError) {
    throw checkError;
  }

  // Get existing types
  const existingTypes = new Set(existing?.map((loc) => loc.type) || []);

  // Only create locations that don't exist
  const locationsToCreate = DEFAULT_LOCATIONS.filter((loc) => !existingTypes.has(loc.type)).map((loc) => ({
    ...loc,
    user_id: userId,
  }));

  // If all locations already exist, skip initialization
  if (locationsToCreate.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('storage_locations').insert(locationsToCreate);

  if (insertError) {
    throw insertError;
  }
}

/**
 * Remove duplicate storage locations for a user
 */
export async function deduplicateStorageLocations(userId: string) {
  const { data: locations, error } = await supabase
    .from('storage_locations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !locations) {
    return;
  }

  // Group by type and keep only the first (oldest) of each type
  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const location of locations) {
    if (seen.has(location.type)) {
      duplicateIds.push(location.id);
    } else {
      seen.add(location.type);
    }
  }

  // Delete duplicates if any found
  if (duplicateIds.length > 0) {
    await supabase.from('storage_locations').delete().in('id', duplicateIds);
  }
}

/**
 * Get all storage locations for a user
 */
export async function getStorageLocations(userId: string) {
  const { data, error } = await supabase
    .from('storage_locations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  // Deduplicate by type - keep only the first occurrence of each type
  const seen = new Set<string>();
  const uniqueLocations = (data || []).filter((location) => {
    if (seen.has(location.type)) {
      return false;
    }
    seen.add(location.type);
    return true;
  });

  return uniqueLocations as StorageLocation[];
}

/**
 * Get all storage items for a user with their location
 */
export async function getStorageItems(userId: string) {
  const { data, error } = await supabase
    .from('storage_items')
    .select(
      `
      *,
      storage_locations (
        id,
        name,
        type
      )
    `,
    )
    .eq('user_id', userId)
    .order('added_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data as (StorageItem & { storage_locations: StorageLocation })[];
}

/**
 * Get storage items by location type
 */
export async function getStorageItemsByLocation(userId: string, locationType: string) {
  const { data, error } = await supabase
    .from('storage_items')
    .select(
      `
      *,
      storage_locations!inner (
        id,
        name,
        type
      )
    `,
    )
    .eq('user_id', userId)
    .eq('storage_locations.type', locationType)
    .order('added_date', { ascending: false});

  if (error) {
    throw error;
  }

  return data as (StorageItem & { storage_locations: StorageLocation })[];
}

/**
 * Create a new storage item
 */
export async function createStorageItem(item: Omit<StorageItemInsert, 'user_id'>, userId: string) {
  const { data, error } = await supabase
    .from('storage_items')
    .insert({
      ...item,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as StorageItem;
}

/**
 * Update a storage item
 */
export async function updateStorageItem(itemId: string, updates: Partial<StorageItemInsert>) {
  const { data, error } = await supabase
    .from('storage_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as StorageItem;
}

/**
 * Delete a storage item
 */
export async function deleteStorageItem(itemId: string) {
  const { error } = await supabase.from('storage_items').delete().eq('id', itemId);

  if (error) {
    throw error;
  }
}

/**
 * Get storage statistics for a user
 */
export async function getStorageStatistics(userId: string) {
  const { data, error } = await supabase
    .from('storage_items')
    .select('id, expiry_date')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const expiringSoon = data.filter((item) => {
    if (!item.expiry_date) return false;
    const expiryDate = new Date(item.expiry_date);
    return expiryDate > now && expiryDate <= sevenDaysFromNow;
  });

  return {
    totalItems: data.length,
    expiringSoon: expiringSoon.length,
  };
}

/**
 * Calculate item status based on expiry date
 */
export function getItemStatus(expiryDate: string | null): 'fresh' | 'expiring' | 'expired' {
  if (!expiryDate) return 'fresh';

  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= 7) return 'expiring';
  return 'fresh';
}
