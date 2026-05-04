import { callAiModel } from './aiClient';
import { FoodItem } from '../types/food';
import { ParseFridgeAiResult, ParsedFridgeItemDraft, FridgeAiInput } from '../types/fridgeAi';
import { normalizeParsedFoodDraft } from '../utils/normalizeFoodDraft';

const SYSTEM_INSTRUCTION = `Ты — помощник для ведения домашнего виртуального холодильника.

Пользователь описывает продукты обычным языком и может прикреплять фото упаковок или таблиц КБЖУ.

Твоя задача: создать структурированные карточки продуктов для добавления в холодильник.

Правила:
1. Возвращай только JSON.
2. Не добавляй текст вне JSON.
3. Для базовых общеизвестных продуктов можно подставлять типовые КБЖУ на 100 г.
   Примеры: картошка, свёкла, морковь, огурцы, помидоры, яблоки, бананы, яйца, рис, гречка, овсянка.
4. Для брендовых, переработанных и готовых продуктов используй фото упаковки/таблицы КБЖУ, если оно есть.
5. Если по фото видно КБЖУ, используй данные с фото как главный источник.
6. Если для брендового продукта нет фото или КБЖУ не видны, не выдумывай точные данные. Поставь nutritionConfidence = "low" и needsReview = true.
7. Если количество продукта не указано и его нельзя определить по фото, поставь amount = null, unit = null, needsReview = true и warning.
8. Не заставляй пользователя выбирать категории. Определи categories автоматически.
9. Все warnings и notes возвращай на русском.
10. Если продукт похож на уже существующий в холодильнике, укажи matchedExistingFoodItemId.
11. Если продукт можно добавить к уже существующему, добавь warning: “Похожий продукт уже есть в холодильнике”.

Разрешённые единицы: g, kg, ml, l, piece, package
Разрешённые категории: protein, carb, fat, vegetable, fruit, dairy, fish, meat, egg, grain, ready_meal, other
Разрешённые состояния: raw, cooked, dry, frozen, ready
Разрешённые источники: ai_text, photo_ocr, ai_text_photo

Формат ответа:
{
  "status": "success",
  "items": [
    {
      "tempId": "string",
      "name": "string",
      "brand": "string | null",
      "amount": 0,
      "unit": "g | kg | ml | l | piece | package | null",
      "gramsPerUnit": 0,
      "kcalPer100g": 0,
      "proteinPer100g": 0,
      "fatPer100g": 0,
      "carbsPer100g": 0,
      "categories": ["..."],
      "state": "raw | cooked | dry | frozen | ready",
      "source": "ai_text | photo_ocr | ai_text_photo",
      "confidenceScore": 0.0,
      "nutritionConfidence": "high | medium | low",
      "needsReview": false,
      "notes": "string",
      "warnings": [],
      "matchedExistingFoodItemId": "string | null"
    }
  ],
  "warnings": [],
  "rawText": "string"
}`;

export const parseFridgeInput = async (input: FridgeAiInput): Promise<ParseFridgeAiResult> => {
  const existingNames = input.existingFoodItems.map(item => `${item.name} (ID: ${item.id})`).join(', ');
  const prompt = `Разбери этот ввод: "${input.text}". 
Имей в виду, в холодильнике уже есть: ${existingNames}. 
Если продукт похож на существующий, верни matchedExistingFoodItemId.`;

  try {
    let responseText = await callAiModel({
      prompt,
      images: input.images,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json"
    });

    // Remove markdown codeblock from response text if present
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      responseText = jsonMatch[1];
    }

    const result = JSON.parse(responseText) as ParseFridgeAiResult;
    return validateParsedFridgeItems(result);
  } catch (error) {
    console.error("Fridge AI service failed:", error);
    return {
      status: "failed",
      items: [],
      warnings: ["Произошла ошибка при разборе ввода"]
    };
  }
};

const validateParsedFridgeItems = (result: ParseFridgeAiResult): ParseFridgeAiResult => {
  if (!result.items) return { ...result, items: [] };

  const items = result.items.map(item => {
    // First normalize the item to remove any nulls from AI
    const normalized = normalizeParsedFoodDraft(item);
    
    const warnings = [...(normalized.warnings || [])];
    let needsReview = normalized.needsReview || false;

    if (normalized.kcalPer100g === null || normalized.kcalPer100g === undefined) {
      warnings.push("Необходимо указать калорийность");
      needsReview = true;
    }

    if (normalized.amount === null || normalized.amount === undefined || !normalized.unit) {
      warnings.push("Уточните количество продукта");
      needsReview = true;
    }

    // Convert kg to g if amount is provided
    let amount = normalized.amount;
    let unit = normalized.unit;
    if (unit === 'kg' && amount !== null) {
      amount = amount * 1000;
      unit = 'g';
    } else if (unit === 'l' && amount !== null) {
      amount = amount * 1000;
      unit = 'ml';
    }

    return {
      ...normalized,
      amount,
      unit,
      warnings: [...new Set(warnings)],
      needsReview
    };
  });

  return {
    ...result,
    items
  };
};
