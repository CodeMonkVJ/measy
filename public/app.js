const state = {
  weeks: [],
  activeWeekId: null,
  meals: [],
  groceries: [],
  groceryOrderedMap: {},
  calendar: {
    monthCursor: null,
    anchorWeekKey: null
  },
  modal: {
    mode: 'create',
    mealId: null,
    ingredients: [],
    instructions: [],
    parsedIngredients: []
  }
};

const weekCreateForm = document.getElementById('week-create-form');
const weekEditForm = document.getElementById('week-edit-form');
const weekCloneForm = document.getElementById('week-clone-form');
const deleteWeekBtn = document.getElementById('delete-week-btn');
const weeksListEl = document.getElementById('weeks-list');
const authUsernameEl = document.getElementById('auth-username');
const logoutBtn = document.getElementById('logout-btn');
const calendarPrevBtn = document.getElementById('calendar-prev-btn');
const calendarNextBtn = document.getElementById('calendar-next-btn');
const calendarMonthLabelEl = document.getElementById('calendar-month-label');
const prepCalendarEl = document.getElementById('prep-calendar');
const prepCalendarNoteEl = document.getElementById('prep-calendar-note');

const openCreateMealBtn = document.getElementById('open-create-meal-btn');
const mealsProgressEl = document.getElementById('meals-progress');
const mealsListEl = document.getElementById('meals-list');
const groceryListEl = document.getElementById('grocery-list');

const mealModalEl = document.getElementById('meal-modal');
const mealModalTitleEl = document.getElementById('meal-modal-title');
const closeMealModalBtn = document.getElementById('close-meal-modal-btn');
const modalDeleteMealBtn = document.getElementById('modal-delete-meal-btn');
const mealEditForm = document.getElementById('meal-edit-form');
const mealSaveBtn = mealEditForm.querySelector('button[type="submit"]');
const plannedServingsStatusEl = document.getElementById('planned-servings-status');

const mealViewModalEl = document.getElementById('meal-view-modal');
const closeMealViewModalBtn = document.getElementById('close-meal-view-modal-btn');
const mealViewTitleEl = document.getElementById('meal-view-title');
const mealViewNameEl = document.getElementById('meal-view-name');
const mealViewServingsEl = document.getElementById('meal-view-servings');
const mealViewPeopleBadgeEl = document.getElementById('meal-view-people-badge');
const mealViewNotesEl = document.getElementById('meal-view-notes');
const mealViewIngredientsListEl = document.getElementById('meal-view-ingredients-list');
const mealViewInstructionsEl = document.getElementById('meal-view-instructions');

const ingredientsSectionEl = document.getElementById('ingredients-section');
const ingredientPasteInputEl = document.getElementById('ingredient-paste-input');
const parseIngredientsBtn = document.getElementById('parse-ingredients-btn');
const addParsedIngredientsBtn = document.getElementById('add-parsed-ingredients-btn');
const ingredientParseStatusEl = document.getElementById('ingredient-parse-status');
const parsedIngredientsListEl = document.getElementById('parsed-ingredients-list');
const ingredientForm = document.getElementById('ingredient-form');
const ingredientsListEl = document.getElementById('ingredients-list');

const instructionsSectionEl = document.getElementById('instructions-section');
const instructionForm = document.getElementById('instruction-form');
const instructionsStatusEl = document.getElementById('instructions-status');

const COMPONENT_TYPES = ['proteins', 'veggies', 'carbs', 'sauces', 'other'];
const COMPONENT_META = {
  proteins: { label: 'Proteins', emoji: '🥩' },
  veggies: { label: 'Veggies', emoji: '🥦' },
  carbs: { label: 'Carbs', emoji: '🍚' },
  sauces: { label: 'Sauces', emoji: '🥣' },
  other: { label: 'Other', emoji: '🧂' }
};
const VIEW_ICON_SVG = `
  <svg class="tiny-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
`;
const EDIT_ICON_SVG = `
  <svg class="tiny-btn-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 21l3.4-.9L18.2 8.3a2.1 2.1 0 0 0-3-3L3.4 17.1 3 21Z"></path>
    <path d="M14.9 5.6l3.5 3.5"></path>
  </svg>
`;
const SWIGGY_LOGO_SVG = `
  <svg class="quick-logo quick-logo-swiggy" viewBox="0 0 61 61" aria-hidden="true">
    <path fill="#FF5200" d="M.32 30.5c0-12.966 0-19.446 3.498-23.868a16.086 16.086 0 0 1 2.634-2.634C10.868.5 17.354.5 30.32.5s19.446 0 23.868 3.498c.978.774 1.86 1.656 2.634 2.634C60.32 11.048 60.32 17.534 60.32 30.5s0 19.446-3.498 23.868a16.086 16.086 0 0 1-2.634 2.634C49.772 60.5 43.286 60.5 30.32 60.5s-19.446 0-23.868-3.498a16.086 16.086 0 0 1-2.634-2.634C.32 49.952.32 43.466.32 30.5Z"></path>
    <path fill="#fff" fill-rule="evenodd" clip-rule="evenodd" d="M32.317 24.065v-6.216a.735.735 0 0 0-.732-.732.735.735 0 0 0-.732.732v7.302c0 .414.336.744.744.744h.714c10.374 0 11.454.54 10.806 2.73-.03.108-.066.21-.102.324-.006.024-.012.048-.018.066-2.724 8.214-10.092 18.492-12.27 21.432a.764.764 0 0 1-1.23 0c-1.314-1.776-4.53-6.24-7.464-11.304-.198-.462-.294-1.542 2.964-1.542h3.984c.222 0 .402.18.402.402v3.216c0 .384.282.738.666.768a.73.73 0 0 0 .582-.216.701.701 0 0 0 .216-.516v-4.362a.76.76 0 0 0-.756-.756h-8.052c-1.404 0-2.256-1.2-2.814-2.292-1.752-3.672-3.006-7.296-3.006-10.152 0-7.314 5.832-13.896 13.884-13.896 7.17 0 12.6 5.214 13.704 11.52.006.054.048.294.054.342.288 3.096-7.788 2.742-11.184 2.76a.357.357 0 0 1-.36-.36v.006Z"></path>
  </svg>
`;
const BLINKIT_LOGO_SVG = `
  <svg class="quick-logo quick-logo-blinkit" viewBox="0 0 114 30" aria-hidden="true">
    <path d="M14.3342 7.186C16.2619 7.186 17.9832 7.66644 19.4978 8.62732C21.0262 9.57447 22.2242 10.9197 23.0917 12.663C23.9316 14.3377 24.3516 16.3075 24.3516 18.5724C24.3516 20.7687 23.9316 22.7316 23.0917 24.4612C22.2517 26.1908 21.0675 27.5429 19.5391 28.5175C17.9969 29.5058 16.2619 30 14.3342 30C12.9297 30 11.6078 29.7117 10.3685 29.1352C9.12927 28.5587 8.06901 27.7488 7.18775 26.7056V29.4852H0V0H7.18775V10.4598C8.06901 9.41661 9.12927 8.61359 10.3685 8.05079C11.6078 7.47426 12.9297 7.186 14.3342 7.186ZM12.1861 24.0494C13.2051 24.0494 14.1139 23.8161 14.9125 23.3493C15.7112 22.8826 16.3377 22.2306 16.7921 21.3933C17.2465 20.5697 17.4737 19.6294 17.4737 18.5724C17.4737 17.5429 17.2465 16.6095 16.7921 15.7721C16.3377 14.9348 15.7112 14.2828 14.9125 13.8161C14.1139 13.3493 13.2051 13.116 12.1861 13.116C11.2223 13.116 10.3617 13.3493 9.60432 13.8161C8.84699 14.269 8.2549 14.9073 7.82804 15.731C7.40118 16.5683 7.18775 17.5154 7.18775 18.5724C7.18775 19.6294 7.40118 20.5765 7.82804 21.4139C8.2549 22.2375 8.84699 22.8826 9.60432 23.3493C10.3617 23.8161 11.2223 24.0494 12.1861 24.0494Z" fill="#F8CB46"></path>
    <path d="M25.3356 29.4852V0H32.5233V29.4852H25.3356Z" fill="#F8CB46"></path>
    <path d="M34.5607 29.4852V7.68016H41.7071V29.4852H34.5607Z" fill="#F8CB46"></path>
    <path d="M57.2319 7.186C58.7603 7.186 60.1372 7.5429 61.3627 8.25669C62.5882 8.95676 63.5521 9.94509 64.2544 11.2217C64.9291 12.512 65.2664 13.9739 65.2664 15.6074V29.4852H58.4092V17.2135C58.4092 16.4173 58.2508 15.7104 57.9341 15.0927C57.6312 14.4612 57.1974 13.9739 56.6329 13.6307C56.0821 13.2876 55.4349 13.116 54.6914 13.116C53.9891 13.116 53.3419 13.2876 52.7498 13.6307C52.1577 13.9602 51.6965 14.4132 51.366 14.9897C51.0218 15.5388 50.8496 16.1839 50.8496 16.9252L50.8083 29.4852H43.6619V7.68016H50.8083V10.1716C51.483 9.23816 52.3849 8.51064 53.5141 7.98902C54.6432 7.45367 55.8824 7.186 57.2319 7.186Z" fill="#F8CB46"></path>
    <path d="M81.0597 17.2135L89.1769 29.4852H81.0597L76.3091 21.7639L74.1198 24.2965V29.4852H66.932V0H74.1198V16.2869L81.0184 7.68016H89.1356L81.0597 17.2135Z" fill="#F8CB46"></path>
    <path d="M34.5569 0.00232667H41.7267V5.59207H34.5569V0.00232667Z" fill="#F8CB46"></path>
    <path d="M90.3176 29.4198V7.61479H97.464V29.4198H90.3176Z" fill="#54B226"></path>
    <path d="M112.575 23.2634L114 27.855C113.353 28.4727 112.534 28.9737 111.542 29.3581C110.564 29.7424 109.607 29.9346 108.671 29.9346C107.322 29.9346 106.117 29.6395 105.057 29.0492C103.996 28.4452 103.17 27.6079 102.578 26.5372C101.986 25.494 101.69 24.2929 101.69 22.9339V13.3183H98.819V7.61479H101.69V0.00241089H108.547V7.61479H113.071V13.3183H108.547V21.6161C108.547 22.3162 108.733 22.8859 109.105 23.3251C109.477 23.7644 109.952 23.984 110.53 23.984C110.943 23.984 111.329 23.9223 111.687 23.7987C112.045 23.6752 112.341 23.4967 112.575 23.2634Z" fill="#54B226"></path>
    <path d="M90.2609 0.00241089H97.4307V5.59215H90.2609V0.00241089Z" fill="#54B226"></path>
  </svg>
`;
const ZEPTO_LOGO_SVG = `
  <svg class="quick-logo quick-logo-zepto" viewBox="0 0 90 30" aria-hidden="true">
    <g clip-path="url(#clip0_57_161)">
      <path fill="#950EDB" fill-rule="evenodd" clip-rule="evenodd" d="M56.923 6.61a1.762 1.762 0 0 1 1.787-1.78h1.258V2.213A1.937 1.937 0 0 1 61.892 0a1.946 1.946 0 0 1 1.863 1.391c.08.266.1.547.06.822V4.83h4.09a1.77 1.77 0 0 1 1.656 1.095 1.787 1.787 0 0 1-1.655 2.463h-4.09v6.303c0 3.073 1.714 4.644 4.09 4.644a1.804 1.804 0 0 1 1.801 1.798 1.797 1.797 0 0 1-1.802 1.799c-4.512 0-7.937-3.176-7.937-8.241V8.389H58.71a1.794 1.794 0 0 1-1.787-1.78ZM41.179 27.656v-6.845a8.695 8.695 0 0 0 5.794 2.164c5.027 0 8.833-4.085 8.833-9.256 0-5.17-3.806-9.255-8.833-9.255a8.535 8.535 0 0 0-5.794 2.197V6.42a1.94 1.94 0 0 0-3.19-1.192 1.94 1.94 0 0 0-.65 1.192v21.237a1.94 1.94 0 0 0 3.191 1.192 1.94 1.94 0 0 0 .65-1.192Zm5.377-19.632c3 0 5.377 2.445 5.377 5.695 0 3.25-2.376 5.695-5.377 5.695s-5.377-2.445-5.377-5.695v-.247c.107-3.105 2.376-5.448 5.377-5.448Zm-29.204 5.666a9.318 9.318 0 0 1 1.478-4.963 9.284 9.284 0 0 1 3.897-3.401 9.256 9.256 0 0 1 9.84 1.293 2.02 2.02 0 0 1 .695 1.451 2 2 0 0 1-.56 1.398l-5.345 6.38a1.612 1.612 0 0 1-1.322.628 1.71 1.71 0 0 1-1.673-1.055 1.719 1.719 0 0 1-.13-.686 1.57 1.57 0 0 1 .414-1.151l4.207-4.943a4.251 4.251 0 0 0-2.292-.629c-2.986 0-5.35 2.51-5.35 5.678s2.33 5.678 5.35 5.678a4.975 4.975 0 0 0 3.681-1.572l.213-.176c.45-.377.824-.69 1.456-.69a1.793 1.793 0 0 1 1.337.514 1.804 1.804 0 0 1 .54 1.33 2.03 2.03 0 0 1-.56 1.252 8.638 8.638 0 0 1-6.667 2.902 9.05 9.05 0 0 1-6.556-2.664 9.096 9.096 0 0 1-2.653-6.574ZM9.903 8.339H2.187a1.787 1.787 0 0 1-1.255-.526 1.797 1.797 0 0 1-.009-2.527 1.76 1.76 0 0 1 1.264-.517h11.557a1.756 1.756 0 0 1 1.65 1.099c.089.217.133.45.13.686a1.86 1.86 0 0 1-.557 1.26L5.572 19.056h8.172a1.756 1.756 0 0 1 1.65 1.1A1.797 1.797 0 0 1 15 22.101a1.787 1.787 0 0 1-1.256.525H1.78a1.797 1.797 0 0 1-1.265-.54c-.334-.341-.519-.801-.515-1.279.012-.472.2-.922.524-1.264l9.38-11.205Zm63.188.229a9.233 9.233 0 0 0-1.556 5.13 9.071 9.071 0 0 0 9.232 9.232 9.233 9.233 0 1 0-7.676-14.362Zm7.676-.552c3.063 0 5.367 2.546 5.367 5.681 0 3.102-2.299 5.681-5.367 5.681s-5.366-2.545-5.366-5.68c0-3.136 2.303-5.682 5.366-5.682Z"></path>
    </g>
    <defs>
      <clipPath id="clip0_57_161">
        <path fill="#fff" d="M0 0h90v30H0z"></path>
      </clipPath>
    </defs>
  </svg>
`;
const AMAZON_LOGO_URL = 'https://m.media-amazon.com/images/I/4172Tfs9xIL._SY269_FMpng_.png';
const UNIT_MAP = {
  tsp: 'tsp',
  tsps: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tbsps: 'tbsp',
  tbspn: 'tbsp',
  tbps: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  cup: 'cup',
  cups: 'cup',
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  clove: 'clove',
  cloves: 'clove',
  can: 'can',
  cans: 'can',
  pack: 'pack',
  packs: 'pack',
  package: 'pack',
  packages: 'pack',
  bunch: 'bunch',
  bunches: 'bunch',
  pinch: 'pinch',
  pinches: 'pinch',
  dash: 'dash',
  handful: 'handful',
  handfuls: 'handful'
};
function getActiveWeek() {
  return state.weeks.find((week) => week.id === state.activeWeekId) || null;
}

function getModalMeal() {
  return state.meals.find((meal) => meal.id === state.modal.mealId) || null;
}

function parseIsoDateToUtc(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toIsoDateUtc(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date, days) {
  const output = new Date(date.getTime());
  output.setUTCDate(output.getUTCDate() + Number(days || 0));
  return output;
}

function startOfUtcMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function shiftUtcMonth(date, offset) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + Number(offset || 0), 1));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatQuantity(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) {
    return '0';
  }

  const rounded = Math.round(num * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }

  return String(rounded);
}

function normalizeGroceryOrderToken(value) {
  return String(value || '').trim().toLowerCase();
}

function buildGroceryOrderKey(item) {
  const name = normalizeGroceryOrderToken(item?.item_name);
  const unit = normalizeGroceryOrderToken(item?.unit);
  return `${name}|${unit}`;
}

function setActiveWeekOrderedKeys(keys) {
  state.groceryOrderedMap = {};
  if (!Array.isArray(keys)) {
    return;
  }

  keys.forEach((key) => {
    const normalized = normalizeGroceryOrderToken(key);
    if (normalized) {
      state.groceryOrderedMap[normalized] = true;
    }
  });
}

function isGroceryOrderedForActiveWeek(item) {
  const key = buildGroceryOrderKey(item);
  return Boolean(state.groceryOrderedMap[key]);
}

async function toggleGroceryOrderedForActiveWeek(groceryKey) {
  if (!state.activeWeekId || !groceryKey) {
    return;
  }

  const normalizedKey = normalizeGroceryOrderToken(groceryKey);
  if (!normalizedKey) {
    return;
  }

  const nextOrdered = !Boolean(state.groceryOrderedMap[normalizedKey]);
  await api(`/api/weeks/${state.activeWeekId}/grocery-orders`, {
    method: 'PUT',
    body: JSON.stringify({
      item_key: normalizedKey,
      ordered: nextOrdered
    })
  });

  if (nextOrdered) {
    state.groceryOrderedMap[normalizedKey] = true;
  } else {
    delete state.groceryOrderedMap[normalizedKey];
  }
}

function buildQuickCommerceLinks(ingredientName) {
  const encoded = encodeURIComponent(String(ingredientName || '').trim());
  return {
    blinkit: `https://blinkit.com/s/?q=${encoded}`,
    zepto: `https://www.zeptonow.com/search?query=${encoded}`,
    swiggy: `https://www.swiggy.com/instamart/search?query=${encoded}`,
    amazon: `https://www.amazon.in/tez/browse/search?qcbrand=qqfsWw9RkO&searchKeyword=${encoded}`
  };
}

function normalizeFractionChars(value) {
  return String(value || '')
    .replaceAll('½', ' 1/2 ')
    .replaceAll('⅓', ' 1/3 ')
    .replaceAll('⅔', ' 2/3 ')
    .replaceAll('¼', ' 1/4 ')
    .replaceAll('¾', ' 3/4 ')
    .replaceAll('⅛', ' 1/8 ')
    .replaceAll('⅜', ' 3/8 ')
    .replaceAll('⅝', ' 5/8 ')
    .replaceAll('⅞', ' 7/8 ');
}

function parseSimpleNumber(part) {
  const cleaned = String(part || '')
    .trim()
    .replace(/^[~]+/, '')
    .replace(/,+/g, '')
    .replace(/x$/i, '');

  if (!cleaned) {
    return null;
  }

  const fracMatch = cleaned.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    const numerator = Number(fracMatch[1]);
    const denominator = Number(fracMatch[2]);
    if (denominator === 0) {
      return null;
    }
    return numerator / denominator;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseQuantityExpression(expression) {
  const raw = String(expression || '').trim();
  if (!raw) {
    return null;
  }

  if (raw.includes('-')) {
    const [startRaw, endRaw] = raw.split('-').map((part) => part.trim());
    const start = parseQuantityExpression(startRaw);
    const end = parseQuantityExpression(endRaw);
    if (start !== null && end !== null) {
      return (start + end) / 2;
    }
  }

  const mixedMatch = raw.match(/^(\d+)\s+(\d+\/\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const fraction = parseSimpleNumber(mixedMatch[2]);
    if (fraction !== null) {
      return whole + fraction;
    }
  }

  return parseSimpleNumber(raw);
}

function cleanIngredientLine(rawLine) {
  return normalizeFractionChars(rawLine)
    .replace(/\u00a0/g, ' ')
    .replace(/^\s*\[[ xX]\]\s*/, '')
    .replace(/^\s*[-*•]+\s*/, '')
    .replace(/^\s*\d+\s*[\).:-]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUnitToken(token) {
  const normalized = String(token || '')
    .trim()
    .toLowerCase()
    .replace(/[().,]/g, '');

  return UNIT_MAP[normalized] || '';
}

function parseIngredientSegment(rawSegment) {
  let segment = cleanIngredientLine(rawSegment);
  if (!segment) {
    return null;
  }

  let component = 'other';
  const componentMatch = segment.match(/^(sauces|proteins|veggies|carbs|other)\s*[:\-]\s*(.+)$/i);
  if (componentMatch) {
    component = componentMatch[1].toLowerCase();
    segment = componentMatch[2].trim();
  }

  if (!segment) {
    return null;
  }

  const approxStripped = segment.replace(/^(about|approx(?:\.|imately)?|around|roughly|~)\s+/i, '');
  const quantityMatch = approxStripped.match(
    /^((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+(?:\.\d+)?))(?:\s*-\s*((?:\d+\s+\d+\/\d+)|(?:\d+\/\d+)|(?:\d+(?:\.\d+)?)))?\s*(.*)$/
  );

  let quantity = 0;
  let remainder = approxStripped;

  if (quantityMatch) {
    const firstPart = quantityMatch[1] || '';
    const secondPart = quantityMatch[2] || '';
    remainder = (quantityMatch[3] || '').trim();

    if (secondPart) {
      const left = parseQuantityExpression(firstPart);
      const right = parseQuantityExpression(secondPart);
      quantity = left !== null && right !== null ? (left + right) / 2 : parseQuantityExpression(firstPart) || 0;
    } else {
      quantity = parseQuantityExpression(firstPart) || 0;
    }
  }

  const tokens = remainder.split(/\s+/).filter(Boolean);
  let unit = '';

  if (tokens.length) {
    unit = normalizeUnitToken(tokens[0]);
    if (unit) {
      tokens.shift();
      if (tokens[0] && tokens[0].toLowerCase() === 'of') {
        tokens.shift();
      }
    }
  }

  if (!unit && !quantity && tokens.length) {
    const naturalUnit = normalizeUnitToken(tokens[0]);
    if (naturalUnit) {
      unit = naturalUnit;
      quantity = 1;
      tokens.shift();
      if (tokens[0] && tokens[0].toLowerCase() === 'of') {
        tokens.shift();
      }
    }
  }

  const itemName = tokens.join(' ').replace(/[.,;]+$/, '').trim() || remainder.trim();
  if (!itemName) {
    return null;
  }

  return {
    component_type: component,
    item_name: itemName,
    quantity: Number.isFinite(quantity) ? Number(quantity.toFixed(2)) : 0,
    unit
  };
}

function parseIngredientText(text) {
  const lines = normalizeFractionChars(text).split('\n');
  const parsed = [];

  for (const rawLine of lines) {
    const cleanedLine = cleanIngredientLine(rawLine);
    if (!cleanedLine) {
      continue;
    }

    const baseSegments = cleanedLine
      .split(/\s+\+\s+|;/)
      .map((part) => part.trim())
      .filter(Boolean);

    const segments = baseSegments.flatMap((segment) =>
      segment
        .split(
          /\s*,\s*(?=(?:about|approx(?:\.|imately)?|around|roughly|~|\d|\d+\/\d+|pinch|dash|handful|tsp|tbsp|cup|oz|lb|g|kg|ml|l|clove|can|pack|bunch)\b)/i
        )
        .map((part) => part.trim())
        .filter(Boolean)
    );

    for (const segment of segments) {
      const parsedItem = parseIngredientSegment(segment);
      if (parsedItem) {
        parsed.push(parsedItem);
      }
    }
  }

  return parsed;
}

function normalizeComponentType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) {
    return 'other';
  }

  if (raw.startsWith('protein')) {
    return 'proteins';
  }
  if (raw.startsWith('veg')) {
    return 'veggies';
  }
  if (raw.startsWith('carb')) {
    return 'carbs';
  }
  if (raw.startsWith('sauce')) {
    return 'sauces';
  }

  return COMPONENT_TYPES.includes(raw) ? raw : 'other';
}

async function api(path, options = {}) {
  const disableAuthRedirect = Boolean(options.disableAuthRedirect);
  const requestOptions = {
    ...options
  };
  delete requestOptions.disableAuthRedirect;

  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    ...requestOptions
  });

  if (response.status === 401 && !disableAuthRedirect) {
    window.location.href = '/login';
    throw new Error('Authentication required.');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Request failed');
  }

  return data;
}

async function loadAuthUser() {
  const user = await api('/api/auth/me');
  authUsernameEl.textContent = user?.username || '-';
}

function setWeekFormsEnabled(enabled) {
  weekEditForm.classList.toggle('disabled-block', !enabled);
  weekCloneForm.classList.toggle('disabled-block', !enabled);
  deleteWeekBtn.classList.toggle('disabled-block', !enabled);
  openCreateMealBtn.classList.toggle('disabled-block', !enabled);
}

function suggestNextWeekStartDate(week) {
  if (!week?.start_date) {
    return '';
  }

  const start = new Date(`${week.start_date}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    return '';
  }

  start.setUTCDate(start.getUTCDate() + Number(week.days_count || 7));
  return start.toISOString().slice(0, 10);
}

function fillWeekEditForm(week) {
  weekEditForm.elements.title.value = week?.title || '';
  weekEditForm.elements.start_date.value = week?.start_date || '';
  weekEditForm.elements.days_count.value = week?.days_count || 7;
  weekEditForm.elements.meals_to_prep.value = week?.meals_to_prep || 14;
  weekEditForm.elements.people_count.value = week?.people_count || 1;

  weekCloneForm.elements.start_date.value = suggestNextWeekStartDate(week);
  weekCloneForm.elements.title.value = '';
  weekCloneForm.elements.title.placeholder = week ? `${week.title} (Repeat)` : 'Leave blank to auto-name';
}

function getTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getWeekDateRangeUtc(week) {
  const startDate = parseIsoDateToUtc(week?.start_date);
  if (!startDate) {
    return null;
  }

  const daysCount = Math.max(1, Number(week?.days_count || 7));
  const endDate = addUtcDays(startDate, daysCount - 1);
  return {
    startDate,
    endDate
  };
}

function compareWeeksForList(a, b) {
  const aRange = getWeekDateRangeUtc(a);
  const bRange = getWeekDateRangeUtc(b);

  if (aRange && bRange) {
    const startDiff = aRange.startDate.getTime() - bRange.startDate.getTime();
    if (startDiff !== 0) {
      return startDiff;
    }

    return String(a.title || '').localeCompare(String(b.title || ''));
  }

  if (aRange && !bRange) {
    return -1;
  }

  if (!aRange && bRange) {
    return 1;
  }

  return String(a.title || '').localeCompare(String(b.title || ''));
}

function getVisibleWeeksForList() {
  const today = getTodayUtc();
  return state.weeks
    .filter((week) => {
      const range = getWeekDateRangeUtc(week);
      if (!range) {
        return true;
      }
      return range.endDate >= today;
    })
    .sort(compareWeeksForList);
}

function hashString(value) {
  const text = String(value || '');
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return hash;
}

function getWeekColorHue(week) {
  const idSeed = Number(week?.id || 0) * 97;
  const textSeed = hashString(week?.title || '');
  return (idSeed + textSeed) % 360;
}

function getWeekColorPalette(week) {
  const hue = getWeekColorHue(week);
  return {
    solid: `hsl(${hue} 72% 44%)`,
    border: `hsl(${hue} 64% 72%)`,
    soft: `hsl(${hue} 88% 94%)`
  };
}

function renderWeeks() {
  weeksListEl.innerHTML = '';
  const visibleWeeks = getVisibleWeeksForList();
  weeksListEl.classList.toggle('scrollable', visibleWeeks.length > 4);

  if (!visibleWeeks.length) {
    const li = document.createElement('li');
    li.textContent = 'No active/upcoming prep weeks. Create one or use the calendar to access past weeks.';
    weeksListEl.append(li);
    return;
  }

  for (const week of visibleWeeks) {
    const li = document.createElement('li');
    const palette = getWeekColorPalette(week);
    li.style.setProperty('--week-color', palette.solid);
    if (week.id === state.activeWeekId) {
      li.classList.add('active');
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.weekId = String(week.id);
    const peopleCount = Number(week.people_count || 1);
    button.innerHTML = `
      <div class="week-title-row">
        <span class="week-color-dot" aria-hidden="true"></span>
        <strong>${escapeHtml(week.title)}</strong>
      </div>
      <div class="week-meta">${week.start_date || 'No start date'} | ${week.days_count} days | ${week.meals_to_prep} target meals | ${peopleCount} people</div>
      <div class="week-meta">${week.meal_count || 0} meals | ${week.total_planned_servings || 0} planned servings</div>
    `;

    li.append(button);
    weeksListEl.append(li);
  }
}

function syncCalendarCursorToWeek(week) {
  const anchorWeekKey = week ? `${week.id}:${week.start_date || ''}` : null;
  if (state.calendar.anchorWeekKey === anchorWeekKey && state.calendar.monthCursor) {
    return;
  }

  state.calendar.anchorWeekKey = anchorWeekKey;

  if (week?.start_date) {
    const startDate = parseIsoDateToUtc(week.start_date);
    if (startDate) {
      state.calendar.monthCursor = toIsoDateUtc(startOfUtcMonth(startDate));
      return;
    }
  }

  const now = new Date();
  state.calendar.monthCursor = toIsoDateUtc(startOfUtcMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))));
}

function buildCalendarWeekCoverageMap() {
  const coverageByDay = new Map();

  for (const week of state.weeks) {
    if (!week?.start_date) {
      continue;
    }

    const startDate = parseIsoDateToUtc(week.start_date);
    if (!startDate) {
      continue;
    }

    const daysCount = Math.max(1, Number(week.days_count || 7));
    const isActive = week.id === state.activeWeekId;
    const coverage = {
      weekId: week.id,
      title: week.title || 'Week',
      isActive,
      palette: getWeekColorPalette(week)
    };

    for (let index = 0; index < daysCount; index += 1) {
      const dayKey = toIsoDateUtc(addUtcDays(startDate, index));
      if (!coverageByDay.has(dayKey)) {
        coverageByDay.set(dayKey, []);
      }
      coverageByDay.get(dayKey).push(coverage);
    }
  }

  const resolvedByDay = new Map();
  coverageByDay.forEach((coverages, dayKey) => {
    if (!coverages.length) {
      return;
    }

    const displayCoverage = coverages.find((item) => item.isActive) || coverages[0];
    const switchCoverage = coverages.find((item) => item.weekId !== state.activeWeekId) || null;

    resolvedByDay.set(dayKey, {
      displayCoverage,
      switchWeekId: switchCoverage ? switchCoverage.weekId : null
    });
  });

  return resolvedByDay;
}

function renderPrepCalendar() {
  const week = getActiveWeek();
  syncCalendarCursorToWeek(week);

  const monthStart = parseIsoDateToUtc(state.calendar.monthCursor) || startOfUtcMonth(new Date());
  const today = new Date();
  const todayKey = toIsoDateUtc(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())));
  const monthLabel = monthStart.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
  calendarMonthLabelEl.textContent = monthLabel;

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  prepCalendarEl.innerHTML = '';
  weekdays.forEach((dayName) => {
    const header = document.createElement('div');
    header.className = 'prep-calendar-weekday';
    header.textContent = dayName;
    prepCalendarEl.append(header);
  });

  const coverageByDay = buildCalendarWeekCoverageMap();
  const monthNumber = monthStart.getUTCMonth();
  const gridStartDate = addUtcDays(monthStart, -monthStart.getUTCDay());

  for (let offset = 0; offset < 42; offset += 1) {
    const dayDate = addUtcDays(gridStartDate, offset);
    const dayKey = toIsoDateUtc(dayDate);
    const isCurrentMonth = dayDate.getUTCMonth() === monthNumber;
    const isToday = dayKey === todayKey;
    const dayEntry = coverageByDay.get(dayKey) || null;
    const dayCoverage = dayEntry?.displayCoverage || null;

    const dayCell = document.createElement('div');
    dayCell.className = 'prep-calendar-day';
    if (!isCurrentMonth) {
      dayCell.classList.add('outside-month');
    }
    if (dayCoverage) {
      dayCell.classList.add('has-week');
      dayCell.style.setProperty('--day-week-color', dayCoverage.palette.solid);
      dayCell.style.setProperty('--day-week-border', dayCoverage.palette.border);
      dayCell.style.setProperty('--day-week-soft', dayCoverage.palette.soft);
      dayCell.title = dayCoverage.title;
      if (dayCoverage.isActive) {
        dayCell.classList.add('active-week-day');
      }
    }
    if (dayEntry?.switchWeekId) {
      dayCell.classList.add('switchable');
      dayCell.dataset.switchWeekId = String(dayEntry.switchWeekId);
    }
    if (isToday) {
      dayCell.classList.add('today');
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'prep-calendar-day-num';
    dayNumber.textContent = String(dayDate.getUTCDate());
    dayCell.append(dayNumber);

    prepCalendarEl.append(dayCell);
  }

  if (!state.weeks.length) {
    prepCalendarNoteEl.textContent = 'Create a week to map prep days on the calendar.';
    return;
  }

  if (!week) {
    prepCalendarNoteEl.textContent = 'Calendar shows all prep weeks by color.';
    return;
  }

  if (!week.start_date) {
    prepCalendarNoteEl.textContent = 'Active week has no start date. Add one in Week Settings to map days.';
    return;
  }

  prepCalendarNoteEl.textContent = `Active: ${week.title} (${week.start_date} for ${week.days_count} day(s)).`;
}

function shiftCalendarByMonths(monthOffset) {
  const baseDate = parseIsoDateToUtc(state.calendar.monthCursor) || startOfUtcMonth(new Date());
  state.calendar.monthCursor = toIsoDateUtc(shiftUtcMonth(baseDate, monthOffset));
  renderPrepCalendar();
}

function mealSummaryText(meal) {
  return `Planned servings: ${meal.planned_servings}`;
}

function getMealsProgress() {
  const week = getActiveWeek();
  const totalPlanned = state.meals.reduce((sum, meal) => sum + Number(meal.planned_servings || 0), 0);
  const target = week ? Math.max(0, Number(week.meals_to_prep || 0)) : 0;
  const isComplete = target > 0 && totalPlanned >= target;
  const remaining = Math.max(0, target - totalPlanned);

  return {
    week,
    totalPlanned,
    target,
    isComplete,
    remaining
  };
}

function getMaxAllowedServingsForModal() {
  const { week, target } = getMealsProgress();
  if (!week || target <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  if (state.modal.mode === 'edit' && state.modal.mealId) {
    const otherPlanned = state.meals.reduce((sum, meal) => {
      if (meal.id === state.modal.mealId) {
        return sum;
      }
      return sum + Number(meal.planned_servings || 0);
    }, 0);
    return Math.max(0, target - otherPlanned);
  }

  const totalPlanned = state.meals.reduce((sum, meal) => sum + Number(meal.planned_servings || 0), 0);
  return Math.max(0, target - totalPlanned);
}

function validatePlannedServingsField() {
  const input = mealEditForm.elements.planned_servings;
  const rawValue = Number(input.value);
  const requested = Number.isFinite(rawValue) ? Math.max(1, Math.floor(rawValue)) : 1;
  const maxAllowed = getMaxAllowedServingsForModal();
  const capped = Number.isFinite(maxAllowed);
  const isValid = !capped || requested <= maxAllowed;

  if (isValid) {
    input.setCustomValidity('');
    if (capped) {
      plannedServingsStatusEl.textContent = `Allowed: up to ${maxAllowed} serving(s) for this week target.`;
    } else {
      plannedServingsStatusEl.textContent = '';
    }
    plannedServingsStatusEl.classList.remove('error');
  } else {
    input.setCustomValidity(`Maximum allowed is ${maxAllowed} serving(s) for this week.`);
    plannedServingsStatusEl.textContent = `Too high. Max allowed is ${maxAllowed} serving(s).`;
    plannedServingsStatusEl.classList.add('error');
  }

  mealSaveBtn.disabled = !mealEditForm.checkValidity();
  return isValid;
}

function renderMealsProgress() {
  const { week, totalPlanned, target, isComplete, remaining } = getMealsProgress();

  mealsProgressEl.textContent = `${totalPlanned}/${target}`;
  mealsProgressEl.classList.toggle('is-complete', isComplete);

  if (!week) {
    openCreateMealBtn.disabled = true;
    openCreateMealBtn.title = 'Select a week first.';
    return;
  }

  openCreateMealBtn.disabled = isComplete;
  openCreateMealBtn.title = isComplete
    ? `Weekly target reached (${totalPlanned}/${target}). Edit existing meals to adjust.`
    : `You can plan ${remaining} more serving(s).`;
}

function renderMeals() {
  renderMealsProgress();
  mealsListEl.innerHTML = '';

  if (!state.activeWeekId) {
    mealsListEl.innerHTML = '<li>Select a week to view meals.</li>';
    return;
  }

  if (!state.meals.length) {
    mealsListEl.innerHTML = '<li>No meals yet. Click + Add Meal.</li>';
    return;
  }

  for (const meal of state.meals) {
    const li = document.createElement('li');
    li.className = 'meal-row';
    li.innerHTML = `
      <div class="meal-row-text">
        <strong>${escapeHtml(meal.name)}</strong>
        <div class="week-meta">${mealSummaryText(meal)}</div>
      </div>
      <div class="meal-row-actions">
        <button
          type="button"
          class="tiny-btn icon-btn secondary"
          data-action="view-meal"
          data-meal-id="${meal.id}"
          aria-label="View meal"
          title="View meal"
        >${VIEW_ICON_SVG}</button>
        <button
          type="button"
          class="tiny-btn icon-btn secondary"
          data-action="edit-meal"
          data-meal-id="${meal.id}"
          aria-label="Edit meal"
          title="Edit meal"
        >${EDIT_ICON_SVG}</button>
      </div>
    `;
    mealsListEl.append(li);
  }
}

function renderGroceries() {
  groceryListEl.innerHTML = '';

  if (!state.activeWeekId) {
    groceryListEl.innerHTML = '<li>Select a week to see grocery totals.</li>';
    return;
  }

  if (!state.groceries.length) {
    groceryListEl.innerHTML = '<li>No grocery totals yet. Add ingredients to meals.</li>';
    return;
  }

  for (const item of state.groceries) {
    const ordered = isGroceryOrderedForActiveWeek(item);
    const groceryKey = buildGroceryOrderKey(item);
    const itemName = escapeHtml(item.item_name);
    const unitText = escapeHtml(item.unit || '');
    const totalText = `${formatQuantity(item.total_quantity)}${unitText ? ` ${unitText}` : ''}`;
    const links = buildQuickCommerceLinks(item.item_name);
    const li = document.createElement('li');
    li.className = ordered ? 'grocery-row is-ordered' : 'grocery-row';
    li.dataset.groceryKey = groceryKey;
    li.title = ordered ? 'Marked as ordered. Click to unmark.' : 'Click to mark as ordered.';
    li.innerHTML = `
      <div class="grocery-row-main">
        <span class="grocery-name">${itemName}</span>
        <strong class="grocery-qty">${totalText}</strong>
        <span class="grocery-order-state">${ordered ? 'Ordered' : ''}</span>
      </div>
      <div class="grocery-quick-links">
        <a
          class="quick-link-btn blinkit"
          href="${links.blinkit}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order ${itemName} on Blinkit"
          title="Order on Blinkit"
        >
          <span class="sr-only">Blinkit</span>
          ${BLINKIT_LOGO_SVG}
        </a>
        <a
          class="quick-link-btn zepto"
          href="${links.zepto}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order ${itemName} on Zepto"
          title="Order on Zepto"
        >
          <span class="sr-only">Zepto</span>
          ${ZEPTO_LOGO_SVG}
        </a>
        <a
          class="quick-link-btn swiggy"
          href="${links.swiggy}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order ${itemName} on Swiggy Instamart"
          title="Order on Swiggy Instamart"
        >
          <span class="sr-only">Swiggy Instamart</span>
          ${SWIGGY_LOGO_SVG}
        </a>
        <a
          class="quick-link-btn amazon"
          href="${links.amazon}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Order ${itemName} on Amazon"
          title="Order on Amazon"
        >
          <span class="sr-only">Amazon</span>
          <img class="quick-logo quick-logo-amazon" src="${AMAZON_LOGO_URL}" alt="" loading="lazy" />
        </a>
      </div>
    `;
    groceryListEl.append(li);
  }
}

function componentTypeOptions(selectedValue) {
  return COMPONENT_TYPES
    .map((value) => `<option value="${value}" ${value === selectedValue ? 'selected' : ''}>${value}</option>`)
    .join('');
}

function setModalIngredientInstructionEnabled(enabled) {
  ingredientsSectionEl.classList.toggle('disabled-block', !enabled);
  instructionsSectionEl.classList.toggle('disabled-block', !enabled);
}

function fillMealForm(meal) {
  mealEditForm.elements.name.value = meal?.name || '';
  mealEditForm.elements.planned_servings.value = meal?.planned_servings || 1;
  mealEditForm.elements.notes.value = meal?.notes || '';
}

function resetModalCollections() {
  state.modal.ingredients = [];
  state.modal.instructions = [];
  state.modal.parsedIngredients = [];
}

function renderModalIngredients() {
  ingredientsListEl.innerHTML = '';

  if (!state.modal.mealId) {
    ingredientsListEl.innerHTML = '<li>Save the meal first, then add ingredients.</li>';
    return;
  }

  if (!state.modal.ingredients.length) {
    ingredientsListEl.innerHTML = '<li>No ingredients yet.</li>';
    return;
  }

  for (const ingredient of state.modal.ingredients) {
    const li = document.createElement('li');
    li.className = 'editable-row';
    li.dataset.ingredientId = String(ingredient.id);
    li.innerHTML = `
      <select name="component_type">${componentTypeOptions(ingredient.component_type || 'other')}</select>
      <input name="item_name" value="${escapeHtml(ingredient.item_name)}" />
      <input name="quantity" type="number" min="0" step="0.1" value="${ingredient.quantity}" />
      <input name="unit" value="${escapeHtml(ingredient.unit || '')}" placeholder="unit" />
      <button type="button" data-action="save-ingredient">Save</button>
      <button type="button" class="danger" data-action="delete-ingredient">Delete</button>
    `;
    ingredientsListEl.append(li);
  }
}

function renderParsedIngredients() {
  parsedIngredientsListEl.innerHTML = '';

  if (!state.modal.parsedIngredients.length) {
    if (!ingredientParseStatusEl.textContent) {
      ingredientParseStatusEl.textContent = 'Paste ingredient lines and click Parse List.';
    }
    return;
  }

  ingredientParseStatusEl.textContent = `Parsed ${state.modal.parsedIngredients.length} line(s). Adjust and click Add Parsed Items.`;

  state.modal.parsedIngredients.forEach((ingredient, index) => {
    const li = document.createElement('li');
    li.className = 'editable-row parsed-row';
    li.dataset.parsedIndex = String(index);
    li.innerHTML = `
      <select name="component_type">${componentTypeOptions(ingredient.component_type || 'other')}</select>
      <input name="item_name" value="${escapeHtml(ingredient.item_name || '')}" />
      <input name="quantity" type="number" min="0" step="0.1" value="${Number(ingredient.quantity || 0)}" />
      <input name="unit" value="${escapeHtml(ingredient.unit || '')}" placeholder="unit" />
      <button type="button" class="danger" data-action="remove-parsed">Remove</button>
    `;
    parsedIngredientsListEl.append(li);
  });
}

function syncParsedIngredientFromRow(row) {
  const parsedIndex = Number(row.dataset.parsedIndex);
  if (!Number.isInteger(parsedIndex) || !state.modal.parsedIngredients[parsedIndex]) {
    return;
  }

  state.modal.parsedIngredients[parsedIndex] = {
    component_type: row.querySelector('[name="component_type"]').value || 'other',
    item_name: String(row.querySelector('[name="item_name"]').value || '').trim(),
    quantity: Number(row.querySelector('[name="quantity"]').value || 0),
    unit: String(row.querySelector('[name="unit"]').value || '').trim()
  };
}

function renderModalInstructions() {
  if (!state.modal.mealId) {
    instructionForm.elements.body.value = '';
    instructionsStatusEl.textContent = 'Save the meal first, then add instructions.';
    return;
  }

  const fullText = state.modal.instructions
    .map((step) => String(step.body || '').trim())
    .filter(Boolean)
    .join('\n\n');

  instructionForm.elements.body.value = fullText;
  instructionsStatusEl.textContent = state.modal.instructions.length
    ? 'Instructions loaded. Edit text and click Save Instructions.'
    : 'No instructions saved yet.';
}

function openModalBase() {
  mealModalEl.classList.remove('hidden');
  syncModalBodyState();
}

function openViewModalBase() {
  mealViewModalEl.classList.remove('hidden');
  syncModalBodyState();
}

function renderViewServings(meal) {
  mealViewServingsEl.textContent = String(meal?.planned_servings || 0);

  const peopleCount = Math.max(1, Number(getActiveWeek()?.people_count || 1));
  if (peopleCount > 1) {
    mealViewPeopleBadgeEl.textContent = `👤 x${peopleCount}`;
    mealViewPeopleBadgeEl.classList.remove('hidden');
  } else {
    mealViewPeopleBadgeEl.textContent = '';
    mealViewPeopleBadgeEl.classList.add('hidden');
  }
}

function syncModalBodyState() {
  const hasOpenModal = !mealModalEl.classList.contains('hidden') || !mealViewModalEl.classList.contains('hidden');
  document.body.classList.toggle('modal-open', hasOpenModal);
}

function closeMealModal() {
  mealModalEl.classList.add('hidden');
  state.modal.mode = 'create';
  state.modal.mealId = null;
  resetModalCollections();
  syncModalBodyState();
}

function closeViewMealModal() {
  mealViewModalEl.classList.add('hidden');
  syncModalBodyState();
}

function renderViewMealData(meal, ingredients, instructions) {
  mealViewTitleEl.textContent = `Meal: ${meal.name}`;
  mealViewNameEl.textContent = meal.name || '-';
  renderViewServings(meal);
  mealViewNotesEl.textContent = meal.notes && meal.notes.trim() ? meal.notes.trim() : 'No notes yet.';
  const peopleCount = Math.max(1, Number(getActiveWeek()?.people_count || 1));
  const plannedServings = Math.max(1, Number(meal?.planned_servings || 1));
  const quantityMultiplier = peopleCount * plannedServings;

  mealViewIngredientsListEl.innerHTML = '';
  if (!ingredients.length) {
    const li = document.createElement('li');
    li.textContent = 'No ingredients yet.';
    mealViewIngredientsListEl.append(li);
  } else {
    for (const ingredient of ingredients) {
      const componentType = normalizeComponentType(ingredient.component_type);
      const componentMeta = COMPONENT_META[componentType] || COMPONENT_META.other;
      const totalQuantity = Number(ingredient.quantity || 0) * quantityMultiplier;
      const unitText = escapeHtml(ingredient.unit || '');
      const li = document.createElement('li');
      li.innerHTML = `
        <span>
          <span class="view-ingredient-chip">${componentMeta.emoji} ${componentMeta.label}</span>
          ${escapeHtml(ingredient.item_name)}
        </span>
        <strong>${formatQuantity(totalQuantity)}${unitText ? ` ${unitText}` : ''}</strong>
      `;
      mealViewIngredientsListEl.append(li);
    }
  }

  const instructionsText = instructions
    .map((step) => String(step.body || '').trim())
    .filter(Boolean)
    .join('\n\n');
  mealViewInstructionsEl.textContent = instructionsText || 'No instructions yet.';
}

async function openViewMealModal(mealId) {
  const meal = state.meals.find((item) => item.id === mealId);
  if (!meal) {
    return;
  }

  closeMealModal();
  mealViewTitleEl.textContent = `Meal: ${meal.name}`;
  mealViewNameEl.textContent = meal.name || '-';
  renderViewServings(meal);
  mealViewNotesEl.textContent = meal.notes && meal.notes.trim() ? meal.notes.trim() : 'No notes yet.';
  mealViewIngredientsListEl.innerHTML = '<li>Loading ingredients...</li>';
  mealViewInstructionsEl.textContent = 'Loading instructions...';
  openViewModalBase();

  try {
    const [ingredients, instructions] = await Promise.all([
      api(`/api/meals/${mealId}/ingredients`),
      api(`/api/meals/${mealId}/instructions`)
    ]);
    renderViewMealData(meal, ingredients, instructions);
  } catch (error) {
    alert(error.message);
    closeViewMealModal();
  }
}

function openCreateMealModal() {
  const { week, isComplete, totalPlanned, target } = getMealsProgress();
  if (!week) {
    alert('Select a week first.');
    return;
  }

  if (isComplete) {
    alert(`Weekly target reached (${totalPlanned}/${target}). Edit existing meals to adjust.`);
    return;
  }

  closeViewMealModal();

  state.modal.mode = 'create';
  state.modal.mealId = null;
  resetModalCollections();

  mealModalTitleEl.textContent = 'Add Meal';
  modalDeleteMealBtn.classList.add('hidden');
  fillMealForm(null);
  ingredientForm.reset();
  instructionForm.reset();
  ingredientPasteInputEl.value = '';
  ingredientParseStatusEl.textContent = '';
  ingredientForm.elements.component_type.value = 'veggies';
  ingredientForm.elements.quantity.value = 0;
  setModalIngredientInstructionEnabled(false);
  renderModalIngredients();
  renderParsedIngredients();
  renderModalInstructions();
  validatePlannedServingsField();
  openModalBase();
}

async function refreshModalCollections() {
  if (!state.modal.mealId) {
    resetModalCollections();
    renderModalIngredients();
    renderParsedIngredients();
    renderModalInstructions();
    return;
  }

  const [ingredients, instructions] = await Promise.all([
    api(`/api/meals/${state.modal.mealId}/ingredients`),
    api(`/api/meals/${state.modal.mealId}/instructions`)
  ]);

  state.modal.ingredients = ingredients;
  state.modal.instructions = instructions;
  renderModalIngredients();
  renderModalInstructions();
}

async function openEditMealModal(mealId) {
  const meal = state.meals.find((item) => item.id === mealId);
  if (!meal) {
    return;
  }

  closeViewMealModal();

  state.modal.mode = 'edit';
  state.modal.mealId = mealId;
  mealModalTitleEl.textContent = `Edit Meal: ${meal.name}`;
  modalDeleteMealBtn.classList.remove('hidden');
  fillMealForm(meal);
  ingredientForm.reset();
  instructionForm.reset();
  state.modal.parsedIngredients = [];
  ingredientPasteInputEl.value = '';
  ingredientParseStatusEl.textContent = '';
  ingredientForm.elements.component_type.value = 'veggies';
  ingredientForm.elements.quantity.value = 0;
  setModalIngredientInstructionEnabled(true);
  renderParsedIngredients();
  validatePlannedServingsField();
  openModalBase();

  try {
    await refreshModalCollections();
  } catch (error) {
    alert(error.message);
  }
}

async function refreshWeeks() {
  state.weeks = await api('/api/weeks');
  const visibleWeeks = getVisibleWeeksForList();

  if (state.activeWeekId && !state.weeks.some((week) => week.id === state.activeWeekId)) {
    state.activeWeekId = null;
  }

  if (!state.activeWeekId && visibleWeeks.length) {
    state.activeWeekId = visibleWeeks[0].id;
  }

  renderWeeks();
  await refreshActiveWeekData();
}

async function refreshActiveWeekData() {
  const week = getActiveWeek();
  const hasWeek = Boolean(week);

  setWeekFormsEnabled(hasWeek);
  fillWeekEditForm(week);

  state.meals = [];
  state.groceries = [];
  state.groceryOrderedMap = {};

  if (!hasWeek) {
    renderMeals();
    renderGroceries();
    renderPrepCalendar();
    return;
  }

  const [meals, groceries, orderedKeys] = await Promise.all([
    api(`/api/weeks/${week.id}/meals`),
    api(`/api/weeks/${week.id}/groceries`),
    api(`/api/weeks/${week.id}/grocery-orders`)
  ]);

  state.meals = meals;
  state.groceries = groceries;
  setActiveWeekOrderedKeys(orderedKeys);

  renderMeals();
  renderGroceries();
  renderPrepCalendar();
  if (!mealModalEl.classList.contains('hidden')) {
    validatePlannedServingsField();
  }
}

weekCreateForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const formData = new FormData(weekCreateForm);
    const created = await api('/api/weeks', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });

    state.activeWeekId = created.id;
    weekCreateForm.reset();
    weekCreateForm.elements.days_count.value = 7;
    weekCreateForm.elements.meals_to_prep.value = 14;
    weekCreateForm.elements.people_count.value = 1;
    await refreshWeeks();
  } catch (error) {
    alert(error.message);
  }
});

weeksListEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-week-id]');
  if (!button) {
    return;
  }

  state.activeWeekId = Number(button.dataset.weekId);
  renderWeeks();

  try {
    await refreshActiveWeekData();
  } catch (error) {
    alert(error.message);
  }
});

weekEditForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const week = getActiveWeek();
  if (!week) {
    return;
  }

  try {
    const formData = new FormData(weekEditForm);
    await api(`/api/weeks/${week.id}`, {
      method: 'PUT',
      body: JSON.stringify(Object.fromEntries(formData.entries()))
    });
    await refreshWeeks();
  } catch (error) {
    alert(error.message);
  }
});

weekCloneForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const week = getActiveWeek();
  if (!week) {
    return;
  }

  try {
    const payload = Object.fromEntries(new FormData(weekCloneForm).entries());
    const cloned = await api(`/api/weeks/${week.id}/clone`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    state.activeWeekId = cloned.id;
    weekCloneForm.reset();
    await refreshWeeks();
  } catch (error) {
    alert(error.message);
  }
});

deleteWeekBtn.addEventListener('click', async () => {
  const week = getActiveWeek();
  if (!week) {
    return;
  }

  const shouldDelete = confirm(`Delete week "${week.title}" and all related data?`);
  if (!shouldDelete) {
    return;
  }

  try {
    await api(`/api/weeks/${week.id}`, { method: 'DELETE' });
    state.activeWeekId = null;
    await refreshWeeks();
  } catch (error) {
    alert(error.message);
  }
});

calendarPrevBtn.addEventListener('click', () => {
  shiftCalendarByMonths(-1);
});

calendarNextBtn.addEventListener('click', () => {
  shiftCalendarByMonths(1);
});

prepCalendarEl.addEventListener('click', async (event) => {
  const dayCell = event.target.closest('.prep-calendar-day.switchable[data-switch-week-id]');
  if (!dayCell) {
    return;
  }

  const nextWeekId = Number(dayCell.dataset.switchWeekId);
  if (!Number.isInteger(nextWeekId) || nextWeekId <= 0 || nextWeekId === state.activeWeekId) {
    return;
  }

  state.activeWeekId = nextWeekId;
  renderWeeks();

  try {
    await refreshActiveWeekData();
  } catch (error) {
    alert(error.message);
  }
});

groceryListEl.addEventListener('click', async (event) => {
  if (event.target.closest('a.quick-link-btn')) {
    return;
  }

  const row = event.target.closest('li.grocery-row[data-grocery-key]');
  if (!row) {
    return;
  }

  try {
    await toggleGroceryOrderedForActiveWeek(row.dataset.groceryKey);
    renderGroceries();
  } catch (error) {
    alert(error.message);
  }
});

openCreateMealBtn.addEventListener('click', () => {
  openCreateMealModal();
});

mealsListEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }

  const mealId = Number(button.dataset.mealId);
  const action = button.dataset.action;
  if (action === 'view-meal') {
    await openViewMealModal(mealId);
    return;
  }

  if (action === 'edit-meal') {
    await openEditMealModal(mealId);
  }
});

mealEditForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!validatePlannedServingsField()) {
    mealEditForm.reportValidity();
    return;
  }

  const formPayload = Object.fromEntries(new FormData(mealEditForm).entries());
  const payload = {
    ...formPayload,
    greens_portion: 0,
    sauces_portion: 0,
    proteins_portion: 0,
    veggies_portion: 0,
    carbs_portion: 0
  };

  try {
    if (state.modal.mode === 'create') {
      const { week, totalPlanned, target } = getMealsProgress();
      if (!week) {
        alert('Select a week first.');
        return;
      }

      const requestedServings = Math.max(1, Number(payload.planned_servings || 1));
      if (target > 0 && totalPlanned + requestedServings > target) {
        alert(`This would exceed weekly target (${totalPlanned + requestedServings}/${target}).`);
        return;
      }

      const created = await api(`/api/weeks/${week.id}/meals`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      state.modal.mode = 'edit';
      state.modal.mealId = created.id;
      mealModalTitleEl.textContent = `Edit Meal: ${created.name}`;
      modalDeleteMealBtn.classList.remove('hidden');
      setModalIngredientInstructionEnabled(true);
      await refreshWeeks();
      await refreshModalCollections();
      validatePlannedServingsField();
      return;
    }

    if (!state.modal.mealId) {
      return;
    }

    await api(`/api/meals/${state.modal.mealId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    await refreshWeeks();
    const meal = getModalMeal();
    mealModalTitleEl.textContent = meal ? `Edit Meal: ${meal.name}` : 'Edit Meal';
    validatePlannedServingsField();
  } catch (error) {
    alert(error.message);
  }
});

mealEditForm.addEventListener('input', () => {
  validatePlannedServingsField();
});

modalDeleteMealBtn.addEventListener('click', async () => {
  if (!state.modal.mealId) {
    return;
  }

  const meal = getModalMeal();
  const shouldDelete = confirm(`Delete meal "${meal?.name || ''}" and all its ingredients/instructions?`);
  if (!shouldDelete) {
    return;
  }

  try {
    await api(`/api/meals/${state.modal.mealId}`, { method: 'DELETE' });
    closeMealModal();
    await refreshWeeks();
  } catch (error) {
    alert(error.message);
  }
});

ingredientForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.modal.mealId) {
    alert('Save the meal first.');
    return;
  }

  try {
    const payload = Object.fromEntries(new FormData(ingredientForm).entries());
    await api(`/api/meals/${state.modal.mealId}/ingredients`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    ingredientForm.reset();
    ingredientForm.elements.component_type.value = 'veggies';
    ingredientForm.elements.quantity.value = 0;

    await refreshModalCollections();
    await refreshActiveWeekData();
  } catch (error) {
    alert(error.message);
  }
});

ingredientsListEl.addEventListener('click', async (event) => {
  const row = event.target.closest('li[data-ingredient-id]');
  if (!row) {
    return;
  }

  const ingredientId = Number(row.dataset.ingredientId);
  const action = event.target.dataset.action;
  if (!action) {
    return;
  }

  try {
    if (action === 'save-ingredient') {
      const payload = {
        component_type: row.querySelector('[name="component_type"]').value,
        item_name: row.querySelector('[name="item_name"]').value,
        quantity: Number(row.querySelector('[name="quantity"]').value),
        unit: row.querySelector('[name="unit"]').value
      };

      await api(`/api/ingredients/${ingredientId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      await refreshModalCollections();
      await refreshActiveWeekData();
      return;
    }

    if (action === 'delete-ingredient') {
      await api(`/api/ingredients/${ingredientId}`, { method: 'DELETE' });
      await refreshModalCollections();
      await refreshActiveWeekData();
    }
  } catch (error) {
    alert(error.message);
  }
});

parseIngredientsBtn.addEventListener('click', () => {
  const parsed = parseIngredientText(ingredientPasteInputEl.value);
  state.modal.parsedIngredients = parsed;

  if (!parsed.length) {
    ingredientParseStatusEl.textContent = 'No ingredients detected. Try one ingredient per line.';
  } else {
    ingredientParseStatusEl.textContent = '';
  }

  renderParsedIngredients();
});

parsedIngredientsListEl.addEventListener('input', (event) => {
  const row = event.target.closest('li[data-parsed-index]');
  if (!row) {
    return;
  }
  syncParsedIngredientFromRow(row);
});

parsedIngredientsListEl.addEventListener('change', (event) => {
  const row = event.target.closest('li[data-parsed-index]');
  if (!row) {
    return;
  }
  syncParsedIngredientFromRow(row);
});

parsedIngredientsListEl.addEventListener('click', (event) => {
  const row = event.target.closest('li[data-parsed-index]');
  if (!row) {
    return;
  }

  const action = event.target.dataset.action;
  if (action !== 'remove-parsed') {
    return;
  }

  const parsedIndex = Number(row.dataset.parsedIndex);
  if (!Number.isInteger(parsedIndex)) {
    return;
  }

  state.modal.parsedIngredients.splice(parsedIndex, 1);
  renderParsedIngredients();
});

addParsedIngredientsBtn.addEventListener('click', async () => {
  if (!state.modal.mealId) {
    alert('Save the meal first.');
    return;
  }

  if (!state.modal.parsedIngredients.length) {
    alert('Parse ingredients first.');
    return;
  }

  const parsedRows = Array.from(parsedIngredientsListEl.querySelectorAll('li[data-parsed-index]'));
  parsedRows.forEach(syncParsedIngredientFromRow);

  const payloads = state.modal.parsedIngredients
    .map((item) => ({
      component_type: item.component_type || 'other',
      item_name: String(item.item_name || '').trim(),
      quantity: Number(item.quantity || 0),
      unit: String(item.unit || '').trim()
    }))
    .filter((item) => item.item_name.length > 0);

  if (!payloads.length) {
    alert('No valid ingredient rows to add.');
    return;
  }

  try {
    await Promise.all(
      payloads.map((payload) =>
        api(`/api/meals/${state.modal.mealId}/ingredients`, {
          method: 'POST',
          body: JSON.stringify(payload)
        })
      )
    );

    ingredientPasteInputEl.value = '';
    state.modal.parsedIngredients = [];
    ingredientParseStatusEl.textContent = `Added ${payloads.length} ingredient(s).`;
    renderParsedIngredients();
    await refreshModalCollections();
    await refreshActiveWeekData();
  } catch (error) {
    alert(error.message);
  }
});

instructionForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.modal.mealId) {
    alert('Save the meal first.');
    return;
  }

  try {
    const fullInstructions = String(instructionForm.elements.body.value || '').trim();

    const existing = state.modal.instructions.slice();
    if (existing.length) {
      await Promise.all(
        existing.map((step) =>
          api(`/api/instructions/${step.id}`, {
            method: 'DELETE'
          })
        )
      );
    }

    if (fullInstructions.length) {
      await api(`/api/meals/${state.modal.mealId}/instructions`, {
        method: 'POST',
        body: JSON.stringify({
          step_order: 1,
          body: fullInstructions
        })
      });
    }

    await refreshModalCollections();
  } catch (error) {
    alert(error.message);
  }
});

closeMealModalBtn.addEventListener('click', () => {
  closeMealModal();
});

mealModalEl.addEventListener('click', (event) => {
  if (event.target === mealModalEl) {
    closeMealModal();
  }
});

closeMealViewModalBtn.addEventListener('click', () => {
  closeViewMealModal();
});

mealViewModalEl.addEventListener('click', (event) => {
  if (event.target === mealViewModalEl) {
    closeViewMealModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mealViewModalEl.classList.contains('hidden')) {
    closeViewMealModal();
    return;
  }

  if (event.key === 'Escape' && !mealModalEl.classList.contains('hidden')) {
    closeMealModal();
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', {
      method: 'POST',
      disableAuthRedirect: true
    });
  } catch (_error) {
    // Ignore and force redirect.
  }
  window.location.href = '/login';
});

(async function init() {
  try {
    setWeekFormsEnabled(false);
    await loadAuthUser();
    await refreshWeeks();
  } catch (error) {
    if (error?.message && error.message !== 'Authentication required.') {
      alert(error.message);
    }
  }
})();
