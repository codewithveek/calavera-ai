import type { OfrendaTier } from './tiers';

/**
 * A small cultural knowledge base for ofrenda placement. The vision model only
 * has to name the object; tradition decides where it goes. That keeps the
 * cultural guidance accurate even with a 500M-parameter vision model.
 */

interface OfrendaElement {
  keywords: readonly string[];
  spanishName: string;
  englishName: string;
  tier: OfrendaTier;
  meaning: string;
}

export interface Placement {
  tier: OfrendaTier;
  spanishName: string;
  englishName: string;
  meaning: string;
}

const ELEMENTS: readonly OfrendaElement[] = [
  {
    keywords: ['photo', 'photograph', 'portrait', 'picture frame', 'frame', 'retrato', 'foto'],
    spanishName: 'El retrato',
    englishName: 'The portrait',
    tier: 'cielo',
    meaning: 'The portrait crowns the ofrenda so the spirit knows this altar was raised for them.',
  },
  {
    keywords: ['cross', 'crucifix', 'rosary', 'saint', 'virgin', 'guadalupe', 'angel', 'cruz', 'rosario', 'santo', 'virgen'],
    spanishName: 'Imágenes sagradas',
    englishName: 'Sacred images',
    tier: 'cielo',
    meaning: 'Sacred images bless the journey and mark the bridge between heaven and earth.',
  },
  {
    keywords: ['papel picado', 'paper banner', 'banner'],
    spanishName: 'Papel picado',
    englishName: 'Cut-paper banners',
    tier: 'cielo',
    meaning: 'Perforated paper flutters in the air, the element that announces the arrival of the spirits.',
  },
  {
    keywords: ['sugar skull', 'calavera de azucar', 'skull', 'calavera'],
    spanishName: 'Calavera de azúcar',
    englishName: 'Sugar skull',
    tier: 'tierra',
    meaning: 'Sugar skulls, often bearing the name of the departed, laugh at death and sweeten the reunion.',
  },
  {
    keywords: ['pan de muerto', 'bread', 'bun', 'loaf', 'pastry', 'pan'],
    spanishName: 'Pan de muerto',
    englishName: 'Bread of the dead',
    tier: 'tierra',
    meaning: 'Pan de muerto, shaped with bones and tears, is the welcoming meal shared with the returning soul.',
  },
  {
    keywords: ['fruit', 'orange', 'banana', 'apple', 'guava', 'tangerine', 'mandarin', 'tejocote', 'sugarcane', 'naranja', 'platano', 'manzana', 'guayaba'],
    spanishName: 'Frutas de temporada',
    englishName: 'Seasonal fruit',
    tier: 'tierra',
    meaning: 'Seasonal fruit offers the sweetness of the harvest to a visitor who has travelled far.',
  },
  {
    keywords: ['mole', 'tamal', 'tamale', 'tamales', 'taco', 'soup', 'rice', 'plate', 'dish', 'food', 'chocolate', 'candy', 'sweets', 'dulce', 'cake', 'cookie', 'comida'],
    spanishName: 'Su platillo favorito',
    englishName: 'Their favourite dish',
    tier: 'tierra',
    meaning: 'Their favourite dish is cooked again so its aroma can be enjoyed by the spirit.',
  },
  {
    keywords: ['tequila', 'mezcal', 'beer', 'wine', 'liquor', 'bottle', 'coffee', 'atole', 'cup', 'mug', 'glass', 'soda', 'drink', 'cerveza', 'cafe', 'taza', 'vaso', 'botella'],
    spanishName: 'Su bebida',
    englishName: 'Their favourite drink',
    tier: 'tierra',
    meaning: 'A cup of what they loved to drink refreshes the soul and toasts their memory.',
  },
  {
    keywords: ['cigar', 'cigarette', 'cigarettes', 'tobacco', 'pipe', 'cigarro', 'puro'],
    spanishName: 'Su tabaco',
    englishName: 'Their tobacco',
    tier: 'tierra',
    meaning: 'Small vices are forgiven tonight: their tobacco is left for them to enjoy once more.',
  },
  {
    keywords: ['candle', 'candles', 'vela', 'velas', 'veladora', 'candlestick', 'lantern'],
    spanishName: 'Las velas',
    englishName: 'Candles',
    tier: 'inframundo',
    meaning: 'Candlelight guides the soul through the darkness back to its family.',
  },
  {
    keywords: ['marigold', 'marigolds', 'cempasuchil', 'flower', 'flowers', 'petal', 'petals', 'bouquet', 'flor', 'flores'],
    spanishName: 'Flor de cempasúchil',
    englishName: 'Marigold flowers',
    tier: 'inframundo',
    meaning: 'The scent and colour of marigolds trace the path home for the returning spirit.',
  },
  {
    keywords: ['copal', 'incense', 'incensario', 'sahumerio'],
    spanishName: 'Copal',
    englishName: 'Copal incense',
    tier: 'inframundo',
    meaning: 'Copal smoke purifies the space and carries prayers between the worlds.',
  },
  {
    keywords: ['water', 'pitcher', 'jug', 'agua', 'jarra'],
    spanishName: 'Un vaso de agua',
    englishName: 'A glass of water',
    tier: 'inframundo',
    meaning: 'Water quenches the thirst of a soul after its long journey from Mictlán.',
  },
  {
    keywords: ['salt', 'sal'],
    spanishName: 'La sal',
    englishName: 'Salt',
    tier: 'inframundo',
    meaning: 'Salt purifies the spirit so it can make the journey in both directions.',
  },
  {
    keywords: ['dog', 'xolo', 'xoloitzcuintle', 'perro'],
    spanishName: 'Xoloitzcuintle',
    englishName: 'The xolo dog',
    tier: 'inframundo',
    meaning: 'The xolo dog guides souls across the river on the road to Mictlán.',
  },
  {
    keywords: ['soap', 'towel', 'mirror', 'comb', 'basin', 'jabon', 'toalla', 'espejo', 'peine'],
    spanishName: 'Para asearse',
    englishName: 'Soap, towel and mirror',
    tier: 'inframundo',
    meaning: 'Soap, a towel and a mirror let the visitor refresh themselves after the journey.',
  },
];

const PERSONAL_BELONGING: Placement = {
  tier: 'tierra',
  spanishName: 'Un recuerdo personal',
  englishName: 'A personal keepsake',
  meaning:
    'Personal belongings (a hat, a guitar, a well-worn tool) sit among the earthly gifts so the soul recognises the life it left behind.',
};

function normalize(text: string): string {
  return ` ${text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
}

function match(text: string): OfrendaElement | undefined {
  const haystack = normalize(text);
  return ELEMENTS.find((element) => element.keywords.some((keyword) => haystack.includes(` ${keyword} `)));
}

const GENERIC_NAMES = new Set(['object', 'item', 'thing', 'things', 'decoration', 'offering', 'objeto', 'cosa']);

function isGeneric(objectName: string): boolean {
  return normalize(objectName)
    .trim()
    .split(' ')
    .every((word) => GENERIC_NAMES.has(word) || word.length <= 2);
}

/**
 * The object name decides placement. The description often mentions the
 * surroundings ("a guitar next to a candle"), so it is only consulted when
 * the model could not name the object specifically.
 */
export function placeOnOfrenda(objectName: string, description: string): Placement {
  const element = match(objectName) ?? (isGeneric(objectName) ? match(description) : undefined);
  if (!element) return PERSONAL_BELONGING;
  const { tier, spanishName, englishName, meaning } = element;
  return { tier, spanishName, englishName, meaning };
}
