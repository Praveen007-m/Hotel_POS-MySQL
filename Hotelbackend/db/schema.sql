-- ================== ROOMS ==================
CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    price_per_night REAL NOT NULL,
    amenities TEXT DEFAULT '{}',
    add_ons TEXT DEFAULT '{}'
);

-- ================== CUSTOMERS ==================
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    email TEXT,
    id_type TEXT,
    id_number TEXT,
    address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ================== BOOKINGS ==================
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    check_in TEXT NOT NULL,
    check_out TEXT,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    price REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- ================== CATEGORIES ==================
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- ================== MENU ITEMS ==================
CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ================== KITCHEN ORDERS ==================
CREATE TABLE IF NOT EXISTS kitchen_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    booking_id INTEGER,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (item_id) REFERENCES menu_items(id)
);

-- ================== ADD ONS ==================
CREATE TABLE IF NOT EXISTS add_ons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    price REAL NOT NULL
);

-- ================== BILLINGS ==================
CREATE TABLE IF NOT EXISTS billings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT,
    idempotency_key TEXT UNIQUE,
    customer_id INTEGER,
    room_id INTEGER,
    check_in TEXT,
    check_out TEXT,
    advance_paid REAL DEFAULT 0,
    total_amount REAL NOT NULL,
    gst_number TEXT,
    is_downloaded INTEGER DEFAULT 0,
    billed_by_id INTEGER,
    billed_by_name TEXT,
    billed_by_role TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ================== INVOICES (Line Items) ==================
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    billing_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('room', 'kitchen', 'addon', 'gst', 'discount')),
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    gst_rate REAL DEFAULT 0,
    gst_amount REAL DEFAULT 0,
    total REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (billing_id) REFERENCES billings(id) ON DELETE CASCADE
);

-- ================== BOOKING ADD ONS ==================
-- ✅ THIS WAS MISSING — caused "no such table: main.booking_addons" error
CREATE TABLE IF NOT EXISTS booking_addons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id TEXT NOT NULL,
    addon_id INTEGER,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (addon_id) REFERENCES add_ons(id)
);

-- ================== EXPENSES ==================
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ================== GST SETTINGS ==================
CREATE TABLE IF NOT EXISTS gst_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT UNIQUE NOT NULL,
    gst_rate REAL NOT NULL DEFAULT 0
);

-- ================== USERS ==================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'kitchen')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ================== STAFF ==================
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ================== RESTAURANT ORDERS ==================
CREATE TABLE IF NOT EXISTS restaurant_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    status TEXT NOT NULL CHECK (
        status IN ('Pending', 'Preparing', 'Served')
    ) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (item_id) REFERENCES menu_items(id)
);

-- ================== INDEXES ==================
-- ✅ All indexes moved to the END — after all tables are created
CREATE INDEX IF NOT EXISTS idx_billings_booking ON billings(booking_id);
CREATE INDEX IF NOT EXISTS idx_billings_idempotency ON billings(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_invoices_billing ON invoices(billing_id);
CREATE INDEX IF NOT EXISTS idx_booking_addons_booking ON booking_addons(booking_id);