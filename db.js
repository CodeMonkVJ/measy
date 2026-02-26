const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
const accountsDir = path.join(dataDir, 'accounts');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(accountsDir)) {
  fs.mkdirSync(accountsDir, { recursive: true });
}

const storeCache = new Map();

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS weeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date TEXT,
      days_count INTEGER NOT NULL DEFAULT 7,
      meals_to_prep INTEGER NOT NULL DEFAULT 14,
      people_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      planned_servings INTEGER NOT NULL DEFAULT 1,
      greens_portion REAL NOT NULL DEFAULT 0,
      sauces_portion REAL NOT NULL DEFAULT 0,
      proteins_portion REAL NOT NULL DEFAULT 0,
      veggies_portion REAL NOT NULL DEFAULT 0,
      carbs_portion REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      component_type TEXT,
      item_name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS instructions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_id INTEGER NOT NULL,
      step_order INTEGER NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS grocery_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      ordered INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (week_id, item_key),
      FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE
    );
  `);

  const weekColumns = db.prepare('PRAGMA table_info(weeks)').all();
  const hasPeopleCount = weekColumns.some((column) => column.name === 'people_count');
  if (!hasPeopleCount) {
    db.exec('ALTER TABLE weeks ADD COLUMN people_count INTEGER NOT NULL DEFAULT 1');
  }
}

function createStatements(db) {
  return {
    listWeeks: db.prepare(`
      SELECT
        w.*,
        COALESCE(COUNT(m.id), 0) AS meal_count,
        COALESCE(SUM(m.planned_servings), 0) AS total_planned_servings
      FROM weeks w
      LEFT JOIN meals m ON m.week_id = w.id
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `),
    getWeek: db.prepare('SELECT * FROM weeks WHERE id = ?'),
    createWeek: db.prepare(`
      INSERT INTO weeks (title, start_date, days_count, meals_to_prep, people_count)
      VALUES (@title, @start_date, @days_count, @meals_to_prep, @people_count)
    `),
    updateWeek: db.prepare(`
      UPDATE weeks
      SET title = @title,
          start_date = @start_date,
          days_count = @days_count,
          meals_to_prep = @meals_to_prep,
          people_count = @people_count
      WHERE id = @id
    `),
    deleteWeek: db.prepare('DELETE FROM weeks WHERE id = ?'),

    listMealsByWeek: db.prepare('SELECT * FROM meals WHERE week_id = ? ORDER BY created_at DESC'),
    getMeal: db.prepare('SELECT * FROM meals WHERE id = ?'),
    createMeal: db.prepare(`
      INSERT INTO meals (
        week_id,
        name,
        planned_servings,
        greens_portion,
        sauces_portion,
        proteins_portion,
        veggies_portion,
        carbs_portion,
        notes
      ) VALUES (
        @week_id,
        @name,
        @planned_servings,
        @greens_portion,
        @sauces_portion,
        @proteins_portion,
        @veggies_portion,
        @carbs_portion,
        @notes
      )
    `),
    updateMeal: db.prepare(`
      UPDATE meals
      SET name = @name,
          planned_servings = @planned_servings,
          greens_portion = @greens_portion,
          sauces_portion = @sauces_portion,
          proteins_portion = @proteins_portion,
          veggies_portion = @veggies_portion,
          carbs_portion = @carbs_portion,
          notes = @notes
      WHERE id = @id
    `),
    deleteMeal: db.prepare('DELETE FROM meals WHERE id = ?'),

    listIngredientsByMeal: db.prepare('SELECT * FROM ingredients WHERE meal_id = ? ORDER BY created_at ASC'),
    getIngredient: db.prepare('SELECT * FROM ingredients WHERE id = ?'),
    createIngredient: db.prepare(`
      INSERT INTO ingredients (meal_id, component_type, item_name, quantity, unit)
      VALUES (@meal_id, @component_type, @item_name, @quantity, @unit)
    `),
    updateIngredient: db.prepare(`
      UPDATE ingredients
      SET component_type = @component_type,
          item_name = @item_name,
          quantity = @quantity,
          unit = @unit
      WHERE id = @id
    `),
    deleteIngredient: db.prepare('DELETE FROM ingredients WHERE id = ?'),

    listInstructionsByMeal: db.prepare('SELECT * FROM instructions WHERE meal_id = ? ORDER BY step_order ASC, id ASC'),
    getInstruction: db.prepare('SELECT * FROM instructions WHERE id = ?'),
    createInstruction: db.prepare(`
      INSERT INTO instructions (meal_id, step_order, body)
      VALUES (@meal_id, @step_order, @body)
    `),
    updateInstruction: db.prepare(`
      UPDATE instructions
      SET step_order = @step_order,
          body = @body
      WHERE id = @id
    `),
    deleteInstruction: db.prepare('DELETE FROM instructions WHERE id = ?'),

    groceryRollupByWeek: db.prepare(`
      SELECT
        i.item_name,
        COALESCE(i.unit, '') AS unit,
        ROUND(SUM(i.quantity * m.planned_servings * COALESCE(w.people_count, 1)), 2) AS total_quantity
      FROM ingredients i
      JOIN meals m ON m.id = i.meal_id
      JOIN weeks w ON w.id = m.week_id
      WHERE m.week_id = ?
      GROUP BY i.item_name, i.unit
      ORDER BY i.item_name COLLATE NOCASE ASC
    `),
    listOrderedGroceryKeysByWeek: db.prepare(`
      SELECT item_key
      FROM grocery_orders
      WHERE week_id = ? AND ordered = 1
      ORDER BY item_key ASC
    `),
    upsertGroceryOrderByWeek: db.prepare(`
      INSERT INTO grocery_orders (week_id, item_key, ordered, updated_at)
      VALUES (@week_id, @item_key, @ordered, datetime('now'))
      ON CONFLICT(week_id, item_key)
      DO UPDATE SET
        ordered = @ordered,
        updated_at = datetime('now')
    `)
  };
}

function toSafeUserId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getUserDbPath(userId) {
  return path.join(accountsDir, `user_${userId}.db`);
}

function getUserStore(userIdRaw) {
  const userId = toSafeUserId(userIdRaw);
  if (!userId) {
    throw new Error('Invalid user id for datastore.');
  }

  if (storeCache.has(userId)) {
    return storeCache.get(userId);
  }

  const dbPath = getUserDbPath(userId);
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');
  initSchema(db);

  const store = {
    db,
    statements: createStatements(db)
  };

  storeCache.set(userId, store);
  return store;
}

module.exports = {
  getUserStore
};
