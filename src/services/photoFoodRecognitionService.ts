import { callAiModel } from './aiClient';
import { PhotoRecognitionInput, PhotoRecognitionResult, RecognizedFoodDraft } from '../types/photoRecognition';
import { FoodCategory, FoodState } from '../types/food';
import { normalizeRecognizedFoodDraft } from '../utils/normalizeFoodDraft';

const SYSTEM_INSTRUCTION = `Ты — помощник по распознаванию продуктов по фото упаковки.

Твоя задача: по изображениям определить продукт и извлечь пищевую ценность.

Правила:
1. Возвращай только JSON.
2. Не добавляй текст вне JSON.
3. Если таблица пищевой ценности видна, используй данные с неё.
4. Если данных не видно, не выдумывай точные КБЖУ. Верни null для неизвестных полей и добавь warning.
5. Если виден вес упаковки, извлеки его.
6. Если виден бренд, извлеки бренд.
7. Если продукт распознан частично, status = "partial".
8. Указывай confidenceScore от 0 до 1.
9. Категории выбирай только из разрешённого списка.
10. Состояние продукта выбирай только из разрешённого списка.
11. Интерфейс приложения русский, поэтому warnings и notes возвращай на русском.

Разрешённые категории:
protein, carb, fat, vegetable, fruit, dairy, fish, meat, egg, grain, ready_meal, other

Разрешённые состояния:
raw, cooked, dry, frozen, ready

Пример JSON:
{
  "status": "success",
  "draft": {
    "name": "Имя продукта",
    "brand": "Бренд",
    "packageAmount": 500,
    "packageUnit": "g",
    "kcalPer100g": 350,
    "proteinPer100g": 12,
    "fatPer100g": 5,
    "carbsPer100g": 60,
    "categories": ["grain"],
    "state": "dry",
    "source": "photo_ocr",
    "confidenceScore": 0.95,
    "notes": "Текст заметки",
    "warnings": []
  },
  "rawText": "Текст извлеченный с фото",
  "warnings": [],
  "confidenceScore": 0.95
}`;

export const recognizeFoodFromPhotos = async (input: PhotoRecognitionInput): Promise<PhotoRecognitionResult> => {
  const prompt = `Распознай продукт на этих фото. ${input.userHint ? `Дополнительная информация от пользователя: ${input.userHint}` : ''}`;

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

    const result = JSON.parse(responseText) as PhotoRecognitionResult;
    return validateRecognizedFoodResult(result);
  } catch (error) {
    console.error("Photo recognition service failed:", error);
    return {
      status: "failed",
      warnings: [`Произошла ошибка при обращении к ИИ: ${error instanceof Error ? error.message : String(error)}`],
      confidenceScore: 0
    };
  }
};

const validateRecognizedFoodResult = (result: PhotoRecognitionResult): PhotoRecognitionResult => {
  if (!result.draft) return result;

  const draft = normalizeRecognizedFoodDraft(result.draft);
  const warnings = [...(result.warnings || []), ...(draft.warnings || [])];

  // Basic validation of types/values
  if (!draft.name) warnings.push("Название продукта не определено");
  if (draft.kcalPer100g === null || draft.kcalPer100g === undefined) warnings.push("Калорийность не определена");
  
  // Ensure categories and state are valid
  const validCategories: FoodCategory[] = ['protein', 'carb', 'fat', 'vegetable', 'fruit', 'dairy', 'fish', 'meat', 'egg', 'grain', 'ready_meal', 'other'];
  const validStates: FoodState[] = ['raw', 'cooked', 'dry', 'frozen', 'ready'];

  if (draft.categories) {
    draft.categories = draft.categories.filter(c => validCategories.includes(c));
    if (draft.categories.length === 0) draft.categories = ['other'];
  } else {
    draft.categories = ['other'];
  }
  
  if (draft.state && !validStates.includes(draft.state)) {
    draft.state = 'ready';
  } else if (!draft.state) {
    draft.state = 'ready';
  }

  return {
    ...result,
    draft,
    warnings: [...new Set(warnings)]
  };
};
