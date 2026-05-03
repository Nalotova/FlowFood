/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RequestedDish {
  name: string;
  normalizedName?: string;
  servings?: number;
  notes?: string;
}

export interface DishIngredientRequirement {
  name: string;
  normalizedName: string;
  amount?: number;
  unit?: string;
  importance: "required" | "recommended" | "optional";
  role: "base" | "protein" | "vegetable" | "carb" | "fat" | "flavor" | "spice" | "topping";
  possibleSubstitutes?: string[];
}

export interface IngredientAvailability {
  requiredIngredient: DishIngredientRequirement;
  status: "available" | "missing" | "partial" | "substitutable";
  matchedFoodItemId?: string;
  matchedFoodName?: string;
  availableAmount?: number;
  missingAmount?: number;
  substituteFoodItemId?: string;
  substituteFoodName?: string;
  note?: string;
}

export interface DishFeasibility {
  status: "can_make" | "can_make_modified" | "needs_shopping" | "cannot_make";
  dishName: string;
  availableIngredients: IngredientAvailability[];
  missingIngredients: IngredientAvailability[];
  suggestedSubstitutions: IngredientAvailability[];
  shoppingList: DishIngredientRequirement[];
  message: string;
  warnings: string[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount?: number;
  unit?: string;
  reason?: string;
  importance: "required" | "recommended" | "optional";
  createdAt: string;
  checked: boolean;
}
