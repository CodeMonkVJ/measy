const path = require('path');
const express = require('express');
const authDb = require('./auth-db');
const { getUserStore } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_COOKIE_NAME = 'measy_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

app.use(express.json());

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : fallback;
}

function toNum(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function requireNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeGroceryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function parseIsoDate(value) {
  if (!requireNonEmptyString(value)) {
    return null;
  }

  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function addUtcDays(date, days) {
  const output = new Date(date.getTime());
  output.setUTCDate(output.getUTCDate() + Number(days || 0));
  return output;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildWeekRange(startDateString, daysCount) {
  const startDate = parseIsoDate(startDateString);
  if (!startDate) {
    return null;
  }

  const safeDaysCount = Math.max(1, Number(daysCount || 1));
  const endDate = addUtcDays(startDate, safeDaysCount - 1);
  return {
    startDate,
    endDate
  };
}

function rangesOverlap(rangeA, rangeB) {
  return rangeA.startDate <= rangeB.endDate && rangeB.startDate <= rangeA.endDate;
}

function findWeekOverlap(statements, startDateString, daysCount, options = {}) {
  const excludeWeekId = Number(options.excludeWeekId || 0);
  const candidateRange = buildWeekRange(startDateString, daysCount);
  if (!candidateRange) {
    return null;
  }

  const existingWeeks = statements.listWeeks.all();
  for (const week of existingWeeks) {
    if (excludeWeekId > 0 && Number(week.id) === excludeWeekId) {
      continue;
    }

    const weekRange = buildWeekRange(week.start_date, week.days_count);
    if (!weekRange) {
      continue;
    }

    if (rangesOverlap(candidateRange, weekRange)) {
      return {
        week,
        weekRange
      };
    }
  }

  return null;
}

function parseCookies(headerValue) {
  const cookies = {};
  const header = String(headerValue || '').trim();
  if (!header) {
    return cookies;
  }

  header.split(';').forEach((part) => {
    const [rawName, ...rawValue] = part.split('=');
    const name = String(rawName || '').trim();
    if (!name) {
      return;
    }
    cookies[name] = decodeURIComponent(rawValue.join('=').trim());
  });

  return cookies;
}

function toBooleanEnv(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return null;
}

function shouldUseSecureCookie(req) {
  const explicit = toBooleanEnv(process.env.SESSION_COOKIE_SECURE);
  if (explicit !== null) {
    return explicit;
  }

  const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const isHttps = req.secure || forwardedProto === 'https';
  return process.env.NODE_ENV === 'production' && isHttps;
}

function setSessionCookie(req, res, token) {
  const secure = shouldUseSecureCookie(req);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    `Expires=${expiresAt.toUTCString()}`
  ];

  if (secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  );
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9_.-]{3,32}$/.test(String(username || ''));
}

function getAuthContextFromRequest(req) {
  authDb.clearExpiredSessions(Date.now());

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }

  const session = authDb.getSessionUserByToken(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    authDb.deleteSessionByToken(token);
    return null;
  }

  return {
    token,
    user: {
      id: session.user.id,
      username: session.user.username
    }
  };
}

function requirePageAuth(req, res, next) {
  const context = getAuthContextFromRequest(req);
  if (!context) {
    return res.redirect('/login');
  }

  req.auth = context;
  return next();
}

function requireApiAuth(req, res, next) {
  const context = getAuthContextFromRequest(req);
  if (!context) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  req.auth = context;
  req.store = getUserStore(context.user.id);
  return next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', (req, res) => {
  const usernameRaw = req.body?.username;
  const passwordRaw = req.body?.password;
  const username = authDb.normalizeUsername(usernameRaw);
  const password = String(passwordRaw || '');

  if (!isValidUsername(username)) {
    return res.status(400).json({ error: 'Username must be 3-32 characters (letters, numbers, ., _, -).' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const existingUser = authDb.getUserByUsername(username);
  if (existingUser) {
    return res.status(409).json({ error: 'Username already registered.' });
  }

  try {
    const createdUser = authDb.createUser(username, password);
    getUserStore(createdUser.id);
    const token = authDb.createSession(createdUser.id, Date.now() + SESSION_TTL_MS);
    setSessionCookie(req, res, token);
    return res.status(201).json({
      id: createdUser.id,
      username: createdUser.username
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to create account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const username = authDb.normalizeUsername(req.body?.username);
  const password = String(req.body?.password || '');

  if (!isValidUsername(username) || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const user = authDb.getUserByUsername(username);
  if (!user || !authDb.verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = authDb.createSession(user.id, Date.now() + SESSION_TTL_MS);
  setSessionCookie(req, res, token);
  return res.json({
    id: user.id,
    username: user.username
  });
});

app.post('/api/auth/logout', (req, res) => {
  const context = getAuthContextFromRequest(req);
  if (context?.token) {
    authDb.deleteSessionByToken(context.token);
  }
  clearSessionCookie(res);
  res.status(204).send();
});

app.get('/api/auth/me', (req, res) => {
  const context = getAuthContextFromRequest(req);
  if (!context) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  res.json({
    id: context.user.id,
    username: context.user.username
  });
});

app.get('/', (req, res) => {
  const context = getAuthContextFromRequest(req);
  if (context) {
    return res.redirect('/app');
  }
  return res.redirect('/login');
});

app.get('/login', (req, res) => {
  const context = getAuthContextFromRequest(req);
  if (context) {
    return res.redirect('/app');
  }
  return res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/app', requirePageAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', requirePageAuth, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth/')) {
    return next();
  }
  return requireApiAuth(req, res, next);
});

app.get('/api/weeks', (req, res) => {
  const { statements } = req.store;
  const weeks = statements.listWeeks.all();
  res.json(weeks);
});

app.post('/api/weeks', (req, res) => {
  const { statements } = req.store;
  const title = req.body?.title;
  if (!requireNonEmptyString(title)) {
    return res.status(400).json({ error: 'Week title is required.' });
  }

  const payload = {
    title: title.trim(),
    start_date: requireNonEmptyString(req.body?.start_date) ? req.body.start_date : null,
    days_count: Math.max(1, toInt(req.body?.days_count, 7)),
    meals_to_prep: Math.max(1, toInt(req.body?.meals_to_prep, 14)),
    people_count: Math.max(1, toInt(req.body?.people_count, 1))
  };

  const overlap = findWeekOverlap(statements, payload.start_date, payload.days_count);
  if (overlap) {
    return res.status(400).json({
      error: `Selected dates overlap with "${overlap.week.title}" (${overlap.week.start_date} to ${toIsoDate(overlap.weekRange.endDate)}).`
    });
  }

  const result = statements.createWeek.run(payload);
  const week = statements.getWeek.get(result.lastInsertRowid);
  res.status(201).json(week);
});

app.get('/api/weeks/:weekId', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const week = statements.getWeek.get(weekId);
  if (!week) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  res.json(week);
});

app.put('/api/weeks/:weekId', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const existing = statements.getWeek.get(weekId);
  if (!existing) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  const title = req.body?.title;
  if (!requireNonEmptyString(title)) {
    return res.status(400).json({ error: 'Week title is required.' });
  }

  const payload = {
    id: weekId,
    title: title.trim(),
    start_date: requireNonEmptyString(req.body?.start_date) ? req.body.start_date : null,
    days_count: Math.max(1, toInt(req.body?.days_count, existing.days_count)),
    meals_to_prep: Math.max(1, toInt(req.body?.meals_to_prep, existing.meals_to_prep)),
    people_count: Math.max(1, toInt(req.body?.people_count, existing.people_count || 1))
  };

  statements.updateWeek.run(payload);
  const updated = statements.getWeek.get(weekId);
  res.json(updated);
});

app.delete('/api/weeks/:weekId', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const existing = statements.getWeek.get(weekId);
  if (!existing) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  statements.deleteWeek.run(weekId);
  res.status(204).send();
});

app.post('/api/weeks/:weekId/clone', (req, res) => {
  const { db, statements } = req.store;
  const sourceWeekId = toInt(req.params.weekId, null);
  if (!sourceWeekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const sourceWeek = statements.getWeek.get(sourceWeekId);
  if (!sourceWeek) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  const clonedTitle = requireNonEmptyString(req.body?.title)
    ? req.body.title.trim()
    : `${sourceWeek.title} (Repeat)`;
  const clonedStartDate = requireNonEmptyString(req.body?.start_date)
    ? req.body.start_date
    : sourceWeek.start_date;

  const overlap = findWeekOverlap(statements, clonedStartDate, sourceWeek.days_count);
  if (overlap) {
    return res.status(400).json({
      error: `Selected clone dates overlap with "${overlap.week.title}" (${overlap.week.start_date} to ${toIsoDate(overlap.weekRange.endDate)}).`
    });
  }

  const cloneWeek = db.transaction(() => {
    const weekInsert = statements.createWeek.run({
      title: clonedTitle,
      start_date: clonedStartDate,
      days_count: sourceWeek.days_count,
      meals_to_prep: sourceWeek.meals_to_prep,
      people_count: sourceWeek.people_count || 1
    });
    const newWeekId = Number(weekInsert.lastInsertRowid);

    const sourceMeals = statements.listMealsByWeek.all(sourceWeekId);
    for (const sourceMeal of sourceMeals) {
      const mealInsert = statements.createMeal.run({
        week_id: newWeekId,
        name: sourceMeal.name,
        planned_servings: sourceMeal.planned_servings,
        greens_portion: sourceMeal.greens_portion,
        sauces_portion: sourceMeal.sauces_portion,
        proteins_portion: sourceMeal.proteins_portion,
        veggies_portion: sourceMeal.veggies_portion,
        carbs_portion: sourceMeal.carbs_portion,
        notes: sourceMeal.notes
      });
      const newMealId = Number(mealInsert.lastInsertRowid);

      const sourceIngredients = statements.listIngredientsByMeal.all(sourceMeal.id);
      for (const sourceIngredient of sourceIngredients) {
        statements.createIngredient.run({
          meal_id: newMealId,
          component_type: sourceIngredient.component_type,
          item_name: sourceIngredient.item_name,
          quantity: sourceIngredient.quantity,
          unit: sourceIngredient.unit
        });
      }

      const sourceInstructions = statements.listInstructionsByMeal.all(sourceMeal.id);
      for (const sourceInstruction of sourceInstructions) {
        statements.createInstruction.run({
          meal_id: newMealId,
          step_order: sourceInstruction.step_order,
          body: sourceInstruction.body
        });
      }
    }

    return statements.getWeek.get(newWeekId);
  });

  const clonedWeek = cloneWeek();
  res.status(201).json(clonedWeek);
});

app.get('/api/weeks/:weekId/meals', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const week = statements.getWeek.get(weekId);
  if (!week) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  const meals = statements.listMealsByWeek.all(weekId);
  res.json(meals);
});

app.post('/api/weeks/:weekId/meals', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const week = statements.getWeek.get(weekId);
  if (!week) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  const name = req.body?.name;
  if (!requireNonEmptyString(name)) {
    return res.status(400).json({ error: 'Meal name is required.' });
  }

  const plannedServings = Math.max(1, toInt(req.body?.planned_servings, 1));
  const targetServings = Math.max(0, toInt(week.meals_to_prep, 0));
  const currentPlannedServings = statements
    .listMealsByWeek
    .all(weekId)
    .reduce((sum, meal) => sum + Number(meal.planned_servings || 0), 0);

  if (targetServings > 0 && currentPlannedServings >= targetServings) {
    return res.status(400).json({
      error: `Weekly servings target already reached (${currentPlannedServings}/${targetServings}). Edit existing meals to adjust.`
    });
  }

  if (targetServings > 0 && currentPlannedServings + plannedServings > targetServings) {
    return res.status(400).json({
      error: `Adding this meal exceeds weekly servings target (${currentPlannedServings + plannedServings}/${targetServings}).`
    });
  }

  const payload = {
    week_id: weekId,
    name: name.trim(),
    planned_servings: plannedServings,
    greens_portion: Math.max(0, toNum(req.body?.greens_portion, 0)),
    sauces_portion: Math.max(0, toNum(req.body?.sauces_portion, 0)),
    proteins_portion: Math.max(0, toNum(req.body?.proteins_portion, 0)),
    veggies_portion: Math.max(0, toNum(req.body?.veggies_portion, 0)),
    carbs_portion: Math.max(0, toNum(req.body?.carbs_portion, 0)),
    notes: requireNonEmptyString(req.body?.notes) ? req.body.notes.trim() : null
  };

  const result = statements.createMeal.run(payload);
  const meal = statements.getMeal.get(result.lastInsertRowid);
  res.status(201).json(meal);
});

app.put('/api/meals/:mealId', (req, res) => {
  const { statements } = req.store;
  const mealId = toInt(req.params.mealId, null);
  if (!mealId) {
    return res.status(400).json({ error: 'Invalid meal id.' });
  }

  const existing = statements.getMeal.get(mealId);
  if (!existing) {
    return res.status(404).json({ error: 'Meal not found.' });
  }

  const name = req.body?.name;
  if (!requireNonEmptyString(name)) {
    return res.status(400).json({ error: 'Meal name is required.' });
  }

  const plannedServings = Math.max(1, toInt(req.body?.planned_servings, existing.planned_servings));
  const week = statements.getWeek.get(existing.week_id);
  const targetServings = Math.max(0, toInt(week?.meals_to_prep, 0));
  const otherPlannedServings = statements
    .listMealsByWeek
    .all(existing.week_id)
    .reduce((sum, meal) => {
      if (meal.id === mealId) {
        return sum;
      }
      return sum + Number(meal.planned_servings || 0);
    }, 0);

  if (targetServings > 0 && otherPlannedServings + plannedServings > targetServings) {
    return res.status(400).json({
      error: `Updated meal exceeds weekly servings target (${otherPlannedServings + plannedServings}/${targetServings}).`
    });
  }

  const payload = {
    id: mealId,
    name: name.trim(),
    planned_servings: plannedServings,
    greens_portion: Math.max(0, toNum(req.body?.greens_portion, existing.greens_portion)),
    sauces_portion: Math.max(0, toNum(req.body?.sauces_portion, existing.sauces_portion)),
    proteins_portion: Math.max(0, toNum(req.body?.proteins_portion, existing.proteins_portion)),
    veggies_portion: Math.max(0, toNum(req.body?.veggies_portion, existing.veggies_portion)),
    carbs_portion: Math.max(0, toNum(req.body?.carbs_portion, existing.carbs_portion)),
    notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() : null
  };

  statements.updateMeal.run(payload);
  const updated = statements.getMeal.get(mealId);
  res.json(updated);
});

app.delete('/api/meals/:mealId', (req, res) => {
  const { statements } = req.store;
  const mealId = toInt(req.params.mealId, null);
  if (!mealId) {
    return res.status(400).json({ error: 'Invalid meal id.' });
  }

  const existing = statements.getMeal.get(mealId);
  if (!existing) {
    return res.status(404).json({ error: 'Meal not found.' });
  }

  statements.deleteMeal.run(mealId);
  res.status(204).send();
});

app.get('/api/meals/:mealId/ingredients', (req, res) => {
  const { statements } = req.store;
  const mealId = toInt(req.params.mealId, null);
  if (!mealId) {
    return res.status(400).json({ error: 'Invalid meal id.' });
  }

  const meal = statements.getMeal.get(mealId);
  if (!meal) {
    return res.status(404).json({ error: 'Meal not found.' });
  }

  const ingredients = statements.listIngredientsByMeal.all(mealId);
  res.json(ingredients);
});

app.post('/api/meals/:mealId/ingredients', (req, res) => {
  const { statements } = req.store;
  const mealId = toInt(req.params.mealId, null);
  if (!mealId) {
    return res.status(400).json({ error: 'Invalid meal id.' });
  }

  const meal = statements.getMeal.get(mealId);
  if (!meal) {
    return res.status(404).json({ error: 'Meal not found.' });
  }

  const itemName = req.body?.item_name;
  if (!requireNonEmptyString(itemName)) {
    return res.status(400).json({ error: 'Ingredient name is required.' });
  }

  const payload = {
    meal_id: mealId,
    component_type: requireNonEmptyString(req.body?.component_type) ? req.body.component_type.trim().toLowerCase() : null,
    item_name: itemName.trim(),
    quantity: Math.max(0, toNum(req.body?.quantity, 0)),
    unit: requireNonEmptyString(req.body?.unit) ? req.body.unit.trim() : null
  };

  const result = statements.createIngredient.run(payload);
  const created = statements.listIngredientsByMeal.all(mealId).find((item) => item.id === Number(result.lastInsertRowid));
  res.status(201).json(created);
});

app.put('/api/ingredients/:ingredientId', (req, res) => {
  const { statements } = req.store;
  const ingredientId = toInt(req.params.ingredientId, null);
  if (!ingredientId) {
    return res.status(400).json({ error: 'Invalid ingredient id.' });
  }

  const existing = statements.getIngredient.get(ingredientId);
  if (!existing) {
    return res.status(404).json({ error: 'Ingredient not found.' });
  }

  const itemName = req.body?.item_name;
  if (!requireNonEmptyString(itemName)) {
    return res.status(400).json({ error: 'Ingredient name is required.' });
  }

  const payload = {
    id: ingredientId,
    component_type: requireNonEmptyString(req.body?.component_type)
      ? req.body.component_type.trim().toLowerCase()
      : null,
    item_name: itemName.trim(),
    quantity: Math.max(0, toNum(req.body?.quantity, existing.quantity)),
    unit: requireNonEmptyString(req.body?.unit) ? req.body.unit.trim() : null
  };

  statements.updateIngredient.run(payload);
  const updated = statements.getIngredient.get(ingredientId);
  res.json(updated);
});

app.delete('/api/ingredients/:ingredientId', (req, res) => {
  const { statements } = req.store;
  const ingredientId = toInt(req.params.ingredientId, null);
  if (!ingredientId) {
    return res.status(400).json({ error: 'Invalid ingredient id.' });
  }

  statements.deleteIngredient.run(ingredientId);
  res.status(204).send();
});

app.get('/api/meals/:mealId/instructions', (req, res) => {
  const { statements } = req.store;
  const mealId = toInt(req.params.mealId, null);
  if (!mealId) {
    return res.status(400).json({ error: 'Invalid meal id.' });
  }

  const meal = statements.getMeal.get(mealId);
  if (!meal) {
    return res.status(404).json({ error: 'Meal not found.' });
  }

  const instructions = statements.listInstructionsByMeal.all(mealId);
  res.json(instructions);
});

app.post('/api/meals/:mealId/instructions', (req, res) => {
  const { statements } = req.store;
  const mealId = toInt(req.params.mealId, null);
  if (!mealId) {
    return res.status(400).json({ error: 'Invalid meal id.' });
  }

  const meal = statements.getMeal.get(mealId);
  if (!meal) {
    return res.status(404).json({ error: 'Meal not found.' });
  }

  const body = req.body?.body;
  if (!requireNonEmptyString(body)) {
    return res.status(400).json({ error: 'Instruction body is required.' });
  }

  const existingSteps = statements.listInstructionsByMeal.all(mealId);
  const highestStep = existingSteps.length ? Math.max(...existingSteps.map((step) => step.step_order || 0)) : 0;
  const payload = {
    meal_id: mealId,
    step_order: Math.max(1, toInt(req.body?.step_order, highestStep + 1)),
    body: body.trim()
  };

  statements.createInstruction.run(payload);
  const instructions = statements.listInstructionsByMeal.all(mealId);
  res.status(201).json(instructions);
});

app.put('/api/instructions/:instructionId', (req, res) => {
  const { statements } = req.store;
  const instructionId = toInt(req.params.instructionId, null);
  if (!instructionId) {
    return res.status(400).json({ error: 'Invalid instruction id.' });
  }

  const existing = statements.getInstruction.get(instructionId);
  if (!existing) {
    return res.status(404).json({ error: 'Instruction not found.' });
  }

  const body = req.body?.body;
  if (!requireNonEmptyString(body)) {
    return res.status(400).json({ error: 'Instruction body is required.' });
  }

  const payload = {
    id: instructionId,
    step_order: Math.max(1, toInt(req.body?.step_order, existing.step_order)),
    body: body.trim()
  };

  statements.updateInstruction.run(payload);
  const updated = statements.getInstruction.get(instructionId);
  res.json(updated);
});

app.delete('/api/instructions/:instructionId', (req, res) => {
  const { statements } = req.store;
  const instructionId = toInt(req.params.instructionId, null);
  if (!instructionId) {
    return res.status(400).json({ error: 'Invalid instruction id.' });
  }

  statements.deleteInstruction.run(instructionId);
  res.status(204).send();
});

app.get('/api/weeks/:weekId/groceries', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const week = statements.getWeek.get(weekId);
  if (!week) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  const groceries = statements.groceryRollupByWeek.all(weekId);
  res.json(groceries);
});

app.get('/api/weeks/:weekId/grocery-orders', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const week = statements.getWeek.get(weekId);
  if (!week) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  const orderedKeys = statements
    .listOrderedGroceryKeysByWeek
    .all(weekId)
    .map((row) => row.item_key);

  res.json(orderedKeys);
});

app.put('/api/weeks/:weekId/grocery-orders', (req, res) => {
  const { statements } = req.store;
  const weekId = toInt(req.params.weekId, null);
  if (!weekId) {
    return res.status(400).json({ error: 'Invalid week id.' });
  }

  const week = statements.getWeek.get(weekId);
  if (!week) {
    return res.status(404).json({ error: 'Week not found.' });
  }

  const itemKey = normalizeGroceryKey(req.body?.item_key);
  if (!itemKey) {
    return res.status(400).json({ error: 'item_key is required.' });
  }

  const ordered = Boolean(req.body?.ordered) ? 1 : 0;
  statements.upsertGroceryOrderByWeek.run({
    week_id: weekId,
    item_key: itemKey,
    ordered
  });

  res.json({
    item_key: itemKey,
    ordered: Boolean(ordered)
  });
});

app.get('*', (_req, res) => {
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Measy running at http://localhost:${PORT}`);
});
