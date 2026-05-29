require('dotenv').config();

const express = require('express');
const session = require('express-session');
const nunjucks = require('nunjucks');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const TEMPLATES_DIR = path.join(__dirname, 'templates');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'wallet',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: false,
};

const DAILY_REWARD = Number(process.env.DAILY_REWARD || 100);

const TRANSLATIONS = {
  en: {
    site_name: 'wallet',
    home_badge: 'We stand with Palestine 🇵🇸',
    home_title: 'Make a professional Discord server',
    home_desc: 'A customizable wallet dashboard with login by code, account info, leaderboard, daily rewards, and transfers.',
    home_stats_title: 'Your account summary',
    username: 'Username',
    add_btn: 'Add to Discord',
    dashboard_btn: 'Dashboard',
    login_btn: 'Login',
    logout_btn: 'Logout',
    lang_btn: '🌐 العربية',
    login_title: 'Login with code',
    login_desc: 'Paste the code you received from the bot.',
    code_label: 'Link code',
    code_placeholder: 'WALLETLINK$XXXXXXXXXX',
    recipient_hint: 'Use Discord ID or username.',
    login_submit: 'Enter dashboard',
    account_title: 'Dashboard',
    profile_title: 'Profile',
    commands_title: 'Commands',
    support_title: 'Support',
    leaderboard_title: 'Leaderboard',
    daily_title: 'Daily reward',
    transfer_title: 'Transfer',
    transfer: 'Transfer',
    balance: 'Balance',
    rank: 'Rank',
    role: 'Role',
    discord_id: 'Username',
    link_code: 'Link code',
    last_daily: 'Last daily',
    daily_status: 'Daily status',
    daily_available: 'Available now',
    daily_unavailable: 'Not available yet',
    remaining: 'Remaining',
    claim_daily: 'Claim daily',
    transfer_to: 'Recipient Discord ID / username',
    transfer_amount: 'Amount',
    transfer_submit: 'Transfer',
    no_user: 'Account not linked yet',
    not_logged_in: 'You are not logged in yet',
    login_error: 'Invalid code',
    login_success: 'Logged in successfully',
    daily_success: 'Daily claimed successfully',
    daily_cooldown: 'Daily is not ready yet',
    transfer_success: 'Transfer completed successfully',
    transfer_failed: 'Transfer failed',
    commands_desc: 'Main bot commands and panels.',
    support_desc: 'Support and contact shortcuts.',
    profile_desc: 'Your linked account details.',
    leaderboard_desc: 'Top 10 users by balance.',
    daily_desc: 'Claim your daily reward every 24 hours.',
    transfer_desc: 'Send balance to another linked user.',
    overview: 'Overview',
    profile: 'Profile',
    daily_reward: 'Daily reward',
    top_money: 'Top by money',
    instructions: 'Use the dashboard to view your wallet, claim rewards, and transfer balance.',
    commands_list_1: '/link',
    commands_list_2: '/daily',
    commands_list_3: '/balance',
    commands_list_4: '/top',
    commands_list_5: '/transfer',
    support_text: 'Contact the bot owner or open a ticket from Discord.',
    go_dashboard: 'Go dashboard',
    
    // Logs Translations
    logs_title: 'Transaction Logs',
    logs_desc: 'View your recent account activity and transfers.',
    log_type: 'Type',
    log_amount: 'Amount',
    log_description: 'Description',
    log_date: 'Date',
    no_logs: 'No transaction history found.',
    log_msg_sent: 'You transferred {amount}$ to {target}',
    log_msg_received: '{sender} transferred {amount}$ to you',
    log_msg_daily: 'You claimed your daily reward',
  },
  ar: {
    site_name: 'wallet',
    home_badge: 'نحن نقف مع فلسطين 🇵🇸',
    home_title: 'اصنع سيرفر ديسكورد احترافي',
    home_desc: 'لوحة محفظة قابلة للتخصيص مع تسجيل دخول بالكود، معلومات الحساب، الترتيب، المكافأة اليومية، والتحويلات.',
    home_stats_title: 'ملخص حسابك',
    username: 'Username',
    add_btn: 'إضافة إلى ديسكورد',
    dashboard_btn: 'الداشبورد',
    login_btn: 'تسجيل الدخول',
    logout_btn: 'تسجيل الخروج',
    lang_btn: '🌐 English',
    login_title: 'تسجيل الدخول بالكود',
    login_desc: 'الصق الكود الذي استلمته من البوت.',
    code_label: 'كود الربط',
    code_placeholder: 'WALLETLINK$XXXXXXXXXX',
    recipient_hint: 'استخدم Discord ID أو اليوزر.',
    login_submit: 'دخول إلى الداشبورد',
    account_title: 'لوحة التحكم',
    profile_title: 'الملف الشخصي',
    commands_title: 'الأوامر',
    support_title: 'الدعم',
    leaderboard_title: 'الترتيب',
    daily_title: 'المكافأة اليومية',
    transfer_title: 'التحويل',
    transfer: 'التحويل',
    balance: 'الرصيد',
    rank: 'الترتيب',
    role: 'الرتبة',
    discord_id: 'Username',
    link_code: 'كود الربط',
    last_daily: 'آخر Daily',
    daily_status: 'حالة الدايلي',
    daily_available: 'متاح الآن',
    daily_unavailable: 'غير متاح الآن',
    remaining: 'المتبقي',
    claim_daily: 'استلام الدايلي',
    transfer_to: 'Discord ID / اسم المستلم',
    transfer_amount: 'المبلغ',
    transfer_submit: 'تحويل',
    no_user: 'لم يتم ربط الحساب بعد',
    not_logged_in: 'أنت لست مسجل دخول بعد',
    login_error: 'الكود غير صحيح',
    login_success: 'تم تسجيل الدخول بنجاح',
    daily_success: 'تم استلام المكافأة اليومية',
    daily_cooldown: 'الدايلي غير جاهز الآن',
    transfer_success: 'تم التحويل بنجاح',
    transfer_failed: 'فشل التحويل',
    commands_desc: 'أوامر البوت واللوحات الأساسية.',
    support_desc: 'معلومات الدعم وطرق التواصل.',
    profile_desc: 'تفاصيل الحساب المرتبط.',
    leaderboard_desc: 'أفضل 10 مستخدمين حسب الرصيد.',
    daily_desc: 'استلم المكافأة كل 24 ساعة.',
    transfer_desc: 'أرسل رصيد إلى مستخدم مرتبط آخر.',
    overview: 'نظرة عامة',
    profile: 'الملف الشخصي',
    daily_reward: 'المكافأة اليومية',
    top_money: 'أعلى رصيد',
    instructions: 'استخدم الداشبورد لعرض المحفظة واستلام المكافآت والتحويل.',
    commands_list_1: '/link',
    commands_list_2: '/daily',
    commands_list_3: '/balance',
    commands_list_4: '/top',
    commands_list_5: '/transfer',
    support_text: 'تواصل مع مالك البوت أو افتح تذكرة من ديسكورد.',
    go_dashboard: 'اذهب إلى الداشبورد',
    
    // Logs Translations
    logs_title: 'سجل العمليات',
    logs_desc: 'عرض تاريخ تحويلاتك والنشاطات الأخيرة لحسابك.',
    log_type: 'النوع',
    log_amount: 'المبلغ',
    log_description: 'التفاصيل',
    log_date: 'التاريخ',
    no_logs: 'لا يوجد أي سجلات عمليات سابقة.',
    log_msg_sent: 'لقد قمت بتحويل {amount}$ إلى {target}',
    log_msg_received: 'لقد قام {sender} بتحويل {amount}$ لك',
    log_msg_daily: 'لقد قمت باستلام مكافئتك اليومية',
  },
};

const NAV_ITEMS = [
  ['overview', 'dashboard'],
  ['profile', 'profile_page'],
  ['daily_reward', 'daily_page'],
  ['transfer', 'transfer_page'],
  ['logs_title', 'logs_page'], // إضافة السجلات لقائمة التنقل
  ['leaderboard_title', 'leaderboard_page'],
  ['commands_title', 'commands_page'],
  ['support_title', 'support_page'],
];

const pool = mysql.createPool(DB_CONFIG);
const columnsCache = new Map();

function nowUtc() {
  return new Date();
}

function parseDt(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value;

  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const dt = new Date(normalized.endsWith('Z') ? normalized : `${normalized}Z`);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  return null;
}

function dtIso(value) {
  const dt = parseDt(value);
  return dt ? dt.toISOString().slice(0, 19) : null;
}

function defaultAvatarUrl(userId) {
  let idx = 0;
  try {
    idx = Number.parseInt(String(userId), 10) % 5;
    if (Number.isNaN(idx)) idx = 0;
  } catch {
    idx = 0;
  }
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function getLang(req) {
  const code = req.session?.lang || 'ar';
  return Object.prototype.hasOwnProperty.call(TRANSLATIONS, code) ? code : 'ar';
}

function tr(req, key) {
  const lang = getLang(req);
  return TRANSLATIONS[lang]?.[key] || key;
}

function isLoggedIn(req) {
  return Boolean(req.session?.discord_id);
}

function remainingDailySeconds(lastDaily) {
  const dt = parseDt(lastDaily);
  if (!dt) return 0;
  const diffMs = nowUtc().getTime() - dt.getTime();
  const remaining = Math.floor(24 * 3600 - diffMs / 1000);
  return Math.max(0, remaining);
}

function displayName(row, fallbackId) {
  if (!row) return fallbackId;
  for (const key of ['global_name', 'username']) {
    const value = row[key];
    if (value) return value;
  }
  return fallbackId;
}

function publicUsername(row, fallbackId) {
  if (!row) return fallbackId;
  for (const key of ['username', 'global_name']) {
    const value = row[key];
    if (value) return value;
  }
  return displayName(row, fallbackId);
}

function getAvatarUrl(row, userId) {
  if (row && row.avatar) return row.avatar;
  return defaultAvatarUrl(userId);
}

function roleName(row) {
  if (row && row.role_name) return row.role_name;
  return '—';
}

async function getConn() {
  return pool.getConnection();
}

async function tableColumns(tableName) {
  if (columnsCache.has(tableName)) return columnsCache.get(tableName);

  const conn = await getConn();
  try {
    const [rows] = await conn.execute(
      `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      `,
      [DB_CONFIG.database, tableName]
    );

    const cols = new Set(rows.map((r) => r.COLUMN_NAME));
    columnsCache.set(tableName, cols);
    return cols;
  } finally {
    conn.release();
  }
}

async function ensureTables() {
  const conn = await getConn();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) NULL,
        avatar VARCHAR(200) NULL,
        global_name VARCHAR(100) NULL,
        role_name VARCHAR(100) NULL,
        balance INT NOT NULL DEFAULT 0,
        lastDaily DATETIME NULL,
        lastClaim DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const usersCols = await tableColumns('users');

    const alters = [
      ['username', 'VARCHAR(100) NULL'],
      ['avatar', 'VARCHAR(200) NULL'],
      ['global_name', 'VARCHAR(100) NULL'],
      ['role_name', 'VARCHAR(100) NULL'],
      ['lastDaily', 'DATETIME NULL'],
      ['lastClaim', 'DATETIME NULL'],
    ];

    for (const [col, ddl] of alters) {
      if (!usersCols.has(col)) {
        try {
          await conn.execute(`ALTER TABLE users ADD COLUMN ${col} ${ddl}`);
        } catch {}
      }
    }

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS link_codes (
        discord_id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // إنشاء جدول السجلات الجديد المتوافق مع البوت
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS transaction_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('transfare', 'daily', 'claim') NOT NULL,
        user_id VARCHAR(50) NOT NULL,
        target_id VARCHAR(50) NULL,
        amount INT NOT NULL,
        note VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    conn.release();
  }
}

// دالة مساعدة لتسجيل الحركات في قاعدة البيانات
async function logTransaction(conn, type, userId, targetId, amount, note = null) {
  await conn.execute(
    'INSERT INTO transaction_logs (type, user_id, target_id, amount, note) VALUES (?, ?, ?, ?, ?)',
    [type, userId, targetId, amount, note]
  );
}

async function ensureUser(userId) {
  const conn = await getConn();
  try {
    await conn.execute('INSERT IGNORE INTO users (id, balance) VALUES (?, 0)', [userId]);
  } finally {
    conn.release();
  }
}

async function userSelectQuery(tableName = 'users') {
  const cols = await tableColumns(tableName);
  const wanted = ['id', 'balance', 'lastDaily'];
  const optional = ['username', 'avatar', 'global_name', 'role_name', 'lastClaim'];
  const selectCols = wanted.concat(optional.filter((c) => cols.has(c)));
  return `SELECT ${selectCols.join(', ')} FROM users WHERE id = ? LIMIT 1`;
}

async function getUserRow(userId) {
  await ensureUser(userId);
  const conn = await getConn();
  try {
    const sql = await userSelectQuery();
    const [rows] = await conn.execute(sql, [userId]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

async function getUserByCode(code) {
  const conn = await getConn();
  try {
    const [rows] = await conn.execute(
      'SELECT discord_id, code, created_at FROM link_codes WHERE code = ? LIMIT 1',
      [code]
    );
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

async function balanceRank(userId) {
  const row = await getUserRow(userId);
  if (!row) return 1;

  const conn = await getConn();
  try {
    const [rows] = await conn.execute(
      'SELECT COUNT(*) AS count FROM users WHERE balance > ?',
      [Number(row.balance || 0)]
    );
    return Number(rows[0].count) + 1;
  } finally {
    conn.release();
  }
}

async function currentUserPayload(req) {
  const discordId = req.session?.discord_id;
  if (!discordId) return null;

  await ensureUser(discordId);
  const row = await getUserRow(discordId);
  const remaining = remainingDailySeconds(row?.lastDaily);

  const publicName = publicUsername(row, discordId);
  const publicDisplay = displayName(row, discordId);

  return {
    discord_id: publicName,
    username: publicName,
    display_name: publicDisplay,
    raw_discord_id: discordId,
    user: {
      display_name: publicDisplay,
      username: publicName,
      avatar_url: getAvatarUrl(row, discordId),
    },
    role: roleName(row),
    balance: Number(row?.balance || 0),
    rank: await balanceRank(discordId),
    lastDaily: row?.lastDaily || null,
    daily_available: remaining <= 0,
    daily_remaining: remaining,
  };
}

function loginRequired(req, res, next) {
  if (!isLoggedIn(req)) {
    return res.redirect('/login');
  }
  return next();
}

app.set('views', TEMPLATES_DIR);
app.set('view engine', 'html');

const env = nunjucks.configure(TEMPLATES_DIR, {
  autoescape: true,
  express: app,
});

env.addFilter('tojson', (obj) => JSON.stringify(obj));
env.addFilter('fmt_time', (value) => dtIso(value) || '—');
env.addFilter('fmt_money', (value) => {
  try {
    return Number.parseInt(value, 10).toLocaleString('en-US');
  } catch {
    return '0';
  }
});
env.addFilter('fmt_duration', (seconds) => {
  let total = 0;
  try {
    total = Math.max(0, Number.parseInt(seconds, 10));
  } catch {
    total = 0;
  }

  const days = Math.floor(total / 86400);
  let rem = total % 86400;
  const hours = Math.floor(rem / 3600);
  rem %= 3600;
  const minutes = Math.floor(rem / 60);
  const secs = rem % 60;

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${secs}s`;
  return `${secs}s`;
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.FLASK_SECRET_KEY || 'change-me-now',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.COOKIE_SECURE === '1',
      maxAge: Number(process.env.SESSION_DAYS || 30) * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(async (req, res, next) => {
  try {
    req.session.lang = req.session.lang || 'ar';

    const current = await currentUserPayload(req);

    const endpointMap = {
      '/': 'index',
      '/login': 'login_page',
      '/dashboard': 'dashboard',
      '/profile': 'profile_page',
      '/daily': 'daily_page',
      '/transfer': 'transfer_page',
      '/logs': 'logs_page', // إضافتها لخريطة الـ endpoints المعرفة
      '/leaderboard': 'leaderboard_page',
      '/commands': 'commands_page',
      '/support': 'support_page',
    };

    res.locals.t = (key) => tr(req, key);
    res.locals.lang = getLang(req);
    res.locals.site_name = tr(req, 'site_name');
    res.locals.current_user = current;
    res.locals.logged_in = isLoggedIn(req);
    res.locals.nav_items = NAV_ITEMS;
    res.locals.translations = TRANSLATIONS;
    res.locals.daily_reward = DAILY_REWARD;
    res.locals.request = {
      endpoint: endpointMap[req.path] || req.path.replace(/\//g, '') || 'index',
    };

    res.locals.url_for = (name, params = {}) => {
      const routes = {
        index: '/',
        login_page: '/login',
        dashboard: '/dashboard',
        profile_page: '/profile',
        daily_page: '/daily',
        transfer_page: '/transfer',
        logs_page: '/logs', // إضافة دالة التوجيه لصفحة السجلات
        leaderboard_page: '/leaderboard',
        commands_page: '/commands',
        support_page: '/support',
        logout: '/logout',
        set_lang: params.code ? `/set-lang/${params.code}` : `/set-lang/${res.locals.lang === 'ar' ? 'en' : 'ar'}`,
      };

      return routes[name] || '/';
    };

    next();
  } catch (err) {
    next(err);
  }
});

app.get('/', (req, res) => {
  res.render('index.html');
});

app.get('/set-lang/:code', (req, res) => {
  const { code } = req.params;
  req.session.lang = Object.prototype.hasOwnProperty.call(TRANSLATIONS, code) ? code : 'ar';
  res.redirect(req.get('referer') || '/');
});

app.get('/login', (req, res) => {
  if (isLoggedIn(req)) return res.redirect('/dashboard');
  res.render('login.html');
});

app.get('/dashboard', loginRequired, (req, res) => {
  res.render('dashboard.html');
});

app.get('/profile', loginRequired, (req, res) => {
  res.render('profile.html');
});

app.get('/daily', loginRequired, (req, res) => {
  res.render('daily.html');
});

app.get('/transfer', loginRequired, (req, res) => {
  res.render('transfer.html');
});

// مسار توجيه صفحة السجلات (Logs Page Template Router)
app.get('/logs', loginRequired, (req, res) => {
  res.render('logs.html');
});

app.get('/leaderboard', (req, res) => {
  res.render('leaderboard.html');
});

app.get('/commands', (req, res) => {
  res.render('commands.html');
});

app.get('/support', (req, res) => {
  res.render('support.html');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.post('/api/login-link', async (req, res, next) => {
  try {
    const code = String(req.body?.code || '').trim();

    if (!code) {
      return res.status(400).json({ error: tr(req, 'login_error') });
    }

    const link = await getUserByCode(code);
    if (!link) {
      return res.status(404).json({ error: tr(req, 'login_error') });
    }

    req.session.discord_id = link.discord_id;
    await ensureUser(link.discord_id);

    return res.json({
      ok: true,
      message: tr(req, 'login_success'),
      discord_id: link.discord_id,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/me', async (req, res, next) => {
  try {
    if (!isLoggedIn(req)) {
      return res.status(401).json({ error: tr(req, 'not_logged_in') });
    }
    const payload = await currentUserPayload(req);
    return res.json(payload);
  } catch (err) {
    next(err);
  }
});

app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const conn = await getConn();
    try {
      const cols = await tableColumns('users');
      const selectCols = ['id', 'balance'];
      for (const col of ['username', 'avatar', 'global_name', 'role_name']) {
        if (cols.has(col)) selectCols.push(col);
      }

      const query = `
        SELECT ${selectCols.join(', ')}
        FROM users
        ORDER BY balance DESC, id ASC
        LIMIT 10
      `;

      const [rows] = await conn.execute(query);
      const items = [];

      for (let idx = 0; idx < (rows || []).length; idx += 1) {
        const row = rows[idx];
        const userId = row.id;
        const name = publicUsername(row, userId);

        items.push({
          rank: idx + 1,
          username: name,
          discord_id: name,
          raw_discord_id: userId,
          balance: Number(row.balance || 0),
          display_name: name,
          avatar_url: getAvatarUrl(row, userId),
          role: roleName(row),
        });
      }

      return res.json({ items });
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

// برمجية جلب السجلات وترجمتها ديناميكياً مع الألوان والقيم المطلوبة
app.get('/api/logs', async (req, res, next) => {
  try {
    if (!isLoggedIn(req)) {
      return res.status(401).json({ error: tr(req, 'not_logged_in') });
    }

    const currentUserId = req.session.discord_id;
    const conn = await getConn();

    try {
      // استعلام يجلب العمليات الخاصة بالمستخدم سواء مرسل، مستلم، أو مكافأة يومية
      const [rows] = await conn.execute(
        `
        SELECT l.*, 
               u1.username AS sender_username, u1.global_name AS sender_global,
               u2.username AS target_username, u2.global_name AS target_global
        FROM transaction_logs l
        LEFT JOIN users u1 ON l.user_id = u1.id
        LEFT JOIN users u2 ON l.target_id = u2.id
        WHERE l.user_id = ? OR l.target_id = ?
        ORDER BY l.created_at DESC
        `,
        [currentUserId, currentUserId]
      );

      const formattedLogs = rows.map((row) => {
        let text = '';
        let color = 'green';
        let prefix = '+';

        const senderName = row.sender_global || row.sender_username || row.user_id;
        const targetName = row.target_global || row.target_username || row.target_id;

        if (row.type === 'daily' || row.type === 'claim') {
          text = tr(req, 'log_msg_daily');
          color = 'green';
          prefix = '+';
        } else if (row.type === 'transfare') {
          if (row.user_id === currentUserId) {
            // تحويل صادر من الحساب الحالي (أحمر)
            text = tr(req, 'log_msg_sent')
              .replace('{amount}', row.amount)
              .replace('{target}', targetName);
            color = 'red';
            prefix = '-';
          } else {
            // تحويل وارد إلى الحساب الحالي (أخضر)
            text = tr(req, 'log_msg_received')
              .replace('{amount}', row.amount)
              .replace('{sender}', senderName);
            color = 'green';
            prefix = '+';
          }
        }

        return {
          id: row.id,
          type: row.type,
          amount_text: `${prefix}${row.amount}$`,
          color: color,
          description: text,
          created_at: row.created_at,
        };
      });

      return res.json({ logs: formattedLogs });
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

app.post('/api/daily-claim', async (req, res, next) => {
  try {
    if (!isLoggedIn(req)) {
      return res.status(401).json({ error: tr(req, 'not_logged_in') });
    }

    const discordId = req.session.discord_id;
    const conn = await getConn();

    try {
      await conn.beginTransaction();
      await ensureUser(discordId);

      const [rows] = await conn.execute(
        'SELECT balance, lastDaily FROM users WHERE id = ? FOR UPDATE',
        [discordId]
      );

      const row = rows[0];
      if (!row) {
        await conn.rollback();
        return res.status(404).json({ error: tr(req, 'transfer_failed') });
      }

      const remaining = remainingDailySeconds(row.lastDaily);
      if (remaining > 0) {
        await conn.rollback();
        return res.status(400).json({
          error: tr(req, 'daily_cooldown'),
          remaining_seconds: remaining,
        });
      }

      const newBalance = Number(row.balance || 0) + DAILY_REWARD;
      const now = nowUtc();

      await conn.execute(
        'UPDATE users SET balance = ?, lastDaily = ? WHERE id = ?',
        [newBalance, now, discordId]
      );

      // تسجيل عملية استلام اليومية في السجلات بنجاح
      await logTransaction(conn, 'daily', discordId, null, DAILY_REWARD, 'Daily Reward Claimed via Dashboard');

      await conn.commit();

      return res.json({
        ok: true,
        message: tr(req, 'daily_success'),
        reward: DAILY_REWARD,
        balance: newBalance,
        remaining_seconds: 24 * 3600,
      });
    } catch (err) {
      try {
        await conn.rollback();
      } catch {}
      return res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

app.post('/api/transfer', async (req, res, next) => {
  try {
    if (!isLoggedIn(req)) {
      return res.status(401).json({ error: tr(req, 'not_logged_in') });
    }

    const recipientKey = String(req.body?.recipient || '').trim();
    const amountRaw = req.body?.amount;
    const amount = Number.parseInt(amountRaw, 10);

    if (!recipientKey || !Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: tr(req, 'transfer_failed') });
    }

    const senderId = req.session.discord_id;
    if (recipientKey === senderId) {
      return res.status(400).json({ error: tr(req, 'transfer_failed') });
    }

    const conn = await getConn();
    try {
      await conn.beginTransaction();

      const cols = await tableColumns('users');
      const selectCols = ['id', 'balance'];
      for (const col of ['username', 'global_name']) {
        if (cols.has(col)) selectCols.push(col);
      }

      const sqlRecipient = `
        SELECT ${selectCols.join(', ')}
        FROM users
        WHERE id = ? OR username = ? OR global_name = ?
        LIMIT 1
      `;
      const [recipientRows] = await conn.execute(sqlRecipient, [
        recipientKey,
        recipientKey,
        recipientKey,
      ]);

      const recipient = recipientRows[0];
      if (!recipient) {
        await conn.rollback();
        return res.status(404).json({ error: tr(req, 'transfer_failed') });
      }

      const recipientId = recipient.id;

      // منع التحويل لنفس الشخص في حال استُخدم اليوزر نيم بدلاً من الآيدي
      if (recipientId === senderId) {
        await conn.rollback();
        return res.status(400).json({ error: tr(req, 'transfer_failed') });
      }

      const [senderRows] = await conn.execute(
        'SELECT balance FROM users WHERE id = ? FOR UPDATE',
        [senderId]
      );
      const senderRow = senderRows[0];
      if (!senderRow) {
        await conn.rollback();
        return res.status(404).json({ error: tr(req, 'transfer_failed') });
      }

      const senderBalance = Number(senderRow.balance || 0);
      if (senderBalance < amount) {
        await conn.rollback();
        return res.status(400).json({ error: tr(req, 'transfer_failed') });
      }

      await ensureUser(recipientId);

      const [recipientBalanceRows] = await conn.execute(
        'SELECT balance FROM users WHERE id = ? FOR UPDATE',
        [recipientId]
      );
      const recipientBalance = Number(recipientBalanceRows[0]?.balance || 0);

      await conn.execute('UPDATE users SET balance = balance - ? WHERE id = ?', [
        amount,
        senderId,
      ]);
      await conn.execute('UPDATE users SET balance = balance + ? WHERE id = ?', [
        amount,
        recipientId,
      ]);

      // تسجيل عملية التحويل المالي في السجلات بنجاح
      await logTransaction(conn, 'transfare', senderId, recipientId, amount, 'Transfer via Dashboard');

      await conn.commit();

      return res.json({
        ok: true,
        message: tr(req, 'transfer_success'),
        sender_balance: senderBalance - amount,
        recipient_balance: recipientBalance + amount,
      });
    } catch (err) {
      try {
        await conn.rollback();
      } catch {}
      return res.status(500).json({ error: err.message });
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

(async () => {
  await ensureTables();

  const PORT = Number(process.env.PORT || 5000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();