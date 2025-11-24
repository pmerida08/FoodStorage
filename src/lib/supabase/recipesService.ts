import { supabase } from './client';
import type { Database } from './types';

export type Recipe = Database['public']['Tables']['recipes']['Row'];

export const getUserRecipes = async (userId: string) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user recipes:', error);
    throw error;
  }

  return data;
};

export const getRecipeById = async (id: string) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching recipe:', error);
    throw error;
  }

  return data;
};
