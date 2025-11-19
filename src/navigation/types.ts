import type { NavigatorScreenParams } from '@react-navigation/native';

export type AppTabsParamList = {
  Home: undefined;
  Storage: undefined;
  Recipes: undefined;
  Cards: undefined;
  Favorites: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  App: NavigatorScreenParams<AppTabsParamList>;
  Auth: undefined;
  AddItem: undefined;
  RecipeDetail: { id: string };
};
