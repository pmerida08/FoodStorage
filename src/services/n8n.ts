export interface SmartRecipe {
  id: string;
  name: string;
  matchScore: number;
  time: string;
  servings: number;
  missing: number;
  image_url?: string;
}

// Placeholder URL - replace with actual n8n webhook URL
const N8N_WEBHOOK_URL = 'https://n8npablo.up.railway.app/webhook/generate-recipes';

export const generateSmartRecipes = async (ingredients: string[], userId: string, language: string = 'en'): Promise<SmartRecipe[]> => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXPO_PUBLIC_N8N_API_KEY || '',
      },
      body: JSON.stringify({ ingredients, userId, language }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n Error Status:', response.status);
      console.error('n8n Error Body:', errorText);
      throw new Error(`Failed to generate recipes: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Ensure the response matches our expected format
    // Assuming n8n returns { recipes: SmartRecipe[] } or just SmartRecipe[]
    // Adjust based on actual n8n workflow response
    const recipes = Array.isArray(data) ? data : data.recipes || [];
    
    return recipes.map((recipe: any, index: number) => ({
      id: recipe.id || `generated-${Date.now()}-${index}`,
      name: recipe.name || 'Unknown Recipe',
      matchScore: recipe.matchScore || 0,
      time: recipe.time || '30 min',
      servings: recipe.servings || 2,
      missing: recipe.missing || 0,
      image_url: recipe.image_url,
    }));
  } catch (error) {
    console.error('Error generating smart recipes:', error);
    throw error;
  }
};
