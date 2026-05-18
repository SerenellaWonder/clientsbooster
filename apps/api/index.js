require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { Parser } = require("json2csv");
const { createEmbedding } = require("./lib/embeddings");
const Stripe = require("stripe");
const crypto = require("crypto");
const adminAuth = require("./middleware/adminAuth");
const { OAuth2Client } = require("google-auth-library");
const { Resend } = require("resend");
const OpenAI = require("openai");
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

async function sendEmail({ to, subject, html, text }) {
  if (!resend || !to) return;

  await resend.emails.send({
    from: "Clients Booster <onboarding@resend.dev>",
    to,
    subject,
    html,
    text,
  });
}



const pool = require("./db");
const authMiddleware = require("./middleware/auth");
const customerAuth = require("./middleware/customerAuth");

const nodemailer = require("nodemailer");

const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const app = express();
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
  const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* ------------------ MIDDLEWARE ------------------ */

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ------------------ HELPERS ------------------ */

function parseTags(tags) {
  if (!tags) return "";
  if (Array.isArray(tags)) return tags.join(", ");
  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(", ");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

function normalizeStatus(status) {
  return status === "published" ? "published" : "draft";
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toIntegerOrZero(value) {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : Math.trunc(n);
}

async function sendAdminTicketOpenedEmail({
  requesterType,
  subject,
  ticketId,
}) {
  if (!process.env.ADMIN_NOTIFICATION_EMAIL) return;

  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_NOTIFICATION_EMAIL,
    subject: `Nuovo ticket #${ticketId}`,
    text: `Nuovo ticket aperto

Tipo: ${requesterType}
Ticket: #${ticketId}
Oggetto: ${subject}`,
  });
}

async function sendCustomerTicketReplyEmail({
  to,
  ticketId,
  subject,
}) {
  if (!to) return;

  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Risposta ticket #${ticketId}`,
    text: `Hai ricevuto una risposta al ticket "${subject}"`,
  });
}

async function sendVendorTicketReplyEmail({
  to,
  ticketId,
  subject,
}) {
  if (!to) return;

  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Risposta ticket #${ticketId}`,
    text: `Hai ricevuto una risposta al ticket "${subject}"`,
  });
}

async function sendWelcomeCustomerEmail({ to, name }) {
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Benvenuto su Clients Booster",
    text: `Ciao ${name || ""},

il tuo account cliente è stato creato correttamente.

Puoi accedere da qui:
${process.env.FRONTEND_URL || "http://localhost:3000"}/customer/login

Grazie,
Clients Booster`,
  });
}

async function sendLoginNotificationEmail({ to, name }) {
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Accesso effettuato su Clients Booster",
    text: `Ciao ${name || ""},

abbiamo rilevato un accesso al tuo account Clients Booster.

Se sei stato tu, non devi fare nulla.

Grazie,
Clients Booster`,
  });
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;

  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset password Clients Booster",
    text: `Hai richiesto il reset della password.

Clicca qui per scegliere una nuova password:
${resetUrl}

Il link scade tra 30 minuti.

Se non hai richiesto tu il reset, ignora questa email.`,
  });
}

/* ------------------ MULTER ------------------ */

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, "uploads/");
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, uniqueSuffix + "-" + safeName);
  },
});

const upload = multer({ storage });

/* ------------------ HEALTH ------------------ */

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/test", (_req, res) => {
  res.json({ message: "API works 🚀" });
});

app.get("/api/debug/openai", (_req, res) => {
  res.json({
    hasKey: !!process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || null,
  });
});
/* =======================================================
   AUTH VENDITORE
======================================================= */

app.post("/api/auth/register-vendor", async (req, res) => {
  const { email, password, storeName } = req.body;

  try {
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email già in uso" });
    }

    const slug = slugify(storeName);

    const existingSlug = await pool.query(
      "SELECT id FROM tenants WHERE slug = $1",
      [slug]
    );

    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: "Slug negozio già esistente" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const tenantResult = await pool.query(
      `
      INSERT INTO tenants (name, slug)
      VALUES ($1, $2)
      RETURNING *
      `,
      [storeName, slug]
    );

    const tenant = tenantResult.rows[0];

    const userResult = await pool.query(
      `
      INSERT INTO users (email, password, tenant_id)
      VALUES ($1, $2, $3)
      RETURNING id, email, tenant_id, role, created_at
      `,
      [email, hashedPassword, tenant.id]
    );

    try {
  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to: userResult.rows[0].email,
    subject: "Benvenuto su Clients Booster Vendor",
    text: `Ciao,

il tuo account venditore è stato creato correttamente.

Store: ${tenant.name}

Puoi accedere da qui:
${process.env.FRONTEND_URL || "http://localhost:3000"}/login

Grazie,
Clients Booster`,
  });
} catch (e) {
  console.error("VENDOR WELCOME EMAIL ERROR:", e.message);
}

    res.json({
      message: "Vendor creato correttamente",
      tenant,
      user: userResult.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore registrazione vendor" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "Utente non trovato" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Password errata" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenant_id,
        role: user.role,
      },
      "super-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login vendor ok",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore login vendor" });
  }
});

/* =======================================================
   AUTH CLIENTE
======================================================= */

app.post("/api/customers/register", async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const existing = await pool.query(
      "SELECT id FROM customers WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email già registrata" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO customers (email, password, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, phone, default_shipping_address, created_at
      `,
      [email, hashed, name]
    );

    try {
  await sendWelcomeCustomerEmail({
    to: result.rows[0].email,
    name: result.rows[0].name,
  });
} catch (e) {
  console.error("WELCOME EMAIL ERROR:", e.message);
}

try {
  await sendMail({
    from: `"Clients Booster" <${process.env.EMAIL_USER}>`,
    to: result.rows[0].email,
    subject: "Benvenuto su Clients Booster",
    text: `Ciao ${result.rows[0].name || ""},

il tuo account cliente è stato creato correttamente.

Puoi accedere da qui:
${process.env.FRONTEND_URL || "http://localhost:3000"}/customer/login

Grazie,
Clients Booster`,
  });
} catch (e) {
  console.error("WELCOME EMAIL ERROR:", e.message);
}
    res.json({
      message: "Cliente registrato correttamente",
      customer: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore registrazione cliente" });
  }
});

app.post("/api/customers/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM customers WHERE email = $1",
      [email]
    );

    const customer = result.rows[0];

    if (!customer) {
      return res.status(400).json({ error: "Utente non trovato" });
    }

    const valid = await bcrypt.compare(password, customer.password);

    if (!valid) {
      return res.status(400).json({ error: "Password errata" });
    }

    const token = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
      },
      "customer-secret",
      { expiresIn: "7d" }
    );

    try {
  await sendLoginNotificationEmail({
    to: customer.email,
    name: customer.name,
  });
} catch (e) {
  console.error("LOGIN EMAIL ERROR:", e.message);
}

    res.json({
      message: "Login cliente ok",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore login cliente" });
  }
});

app.post("/api/customers/google-login", async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: "Credential Google mancante" });
  }

  if (!googleClient) {
    return res.status(500).json({ error: "Google login non configurato" });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Account Google non valido" });
    }

    const email = payload.email.toLowerCase();
    const name = payload.name || email.split("@")[0];

    let customerResult = await pool.query(
      "SELECT * FROM customers WHERE email = $1",
      [email]
    );

    let customer = customerResult.rows[0];

    if (!customer) {
      customerResult = await pool.query(
        `
        INSERT INTO customers (email, password, name)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [email, "GOOGLE_AUTH", name]
      );

      customer = customerResult.rows[0];
    }

    const token = jwt.sign(
      {
        customerId: customer.id,
        email: customer.email,
      },
      "customer-secret",
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login Google cliente ok",
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
      },
    });
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err);
    return res.status(500).json({ error: "Errore login Google" });
  }
});

/* =======================================================
   DASHBOARD VENDITORE
======================================================= */

app.get("/api/vendor/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        users.email,
        users.role,
        tenants.id AS tenant_id,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM users
      JOIN tenants ON users.tenant_id = tenants.id
      WHERE users.id = $1
      `,
      [req.user.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Vendor non trovato" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento vendor" });
  }
});

app.get("/api/vendor/dashboard", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const productsCount = await pool.query(
      "SELECT COUNT(*) FROM products WHERE tenant_id = $1",
      [tenantId]
    );

    const publishedCount = await pool.query(
      "SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND status = 'published'",
      [tenantId]
    );

    const ordersCount = await pool.query(
      "SELECT COUNT(*) FROM orders WHERE tenant_id = $1",
      [tenantId]
    );

    res.json({
      stats: {
        products: Number(productsCount.rows[0].count),
        publishedProducts: Number(publishedCount.rows[0].count),
        orders: Number(ordersCount.rows[0].count),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore dashboard vendor" });
  }
});

// ===============================
// VENDOR PARTNERSHIPS
// ===============================

app.get("/api/vendor/partnerships/matches", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    if (!tenantId) {
      return res.status(404).json({ error: "Store non trovato" });
    }

    const currentProducts = await pool.query(
      `
      SELECT category, tags
      FROM products
      WHERE tenant_id = $1
      `,
      [tenantId]
    );

    const keywords = new Set();

    currentProducts.rows.forEach((p) => {
      if (p.category) keywords.add(String(p.category).toLowerCase());

      if (p.tags) {
        String(p.tags)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .forEach((t) => keywords.add(t));
      }
    });

    const allProducts = await pool.query(
      `
      SELECT
        p.id,
        p.title,
        p.category,
        p.tags,
        t.id AS tenant_id,
        t.name AS store_name,
        t.slug AS store_slug
      FROM products p
      JOIN tenants t ON t.id = p.tenant_id
      WHERE p.status = 'published'
        AND p.tenant_id <> $1
      `,
      [tenantId]
    );

    const matchesMap = {};

    allProducts.rows.forEach((product) => {
      let score = 0;

      const category = String(product.category || "").toLowerCase();

      if (category && keywords.has(category)) score += 3;

      if (product.tags) {
        String(product.tags)
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
          .forEach((tag) => {
            if (keywords.has(tag)) score += 1;
          });
      }

      if (score === 0) score = 1;
      if (score > 0) {
        if (!matchesMap[product.tenant_id]) {
          matchesMap[product.tenant_id] = {
            tenant_id: product.tenant_id,
            store_name: product.store_name,
            store_slug: product.store_slug,
            score: 0,
            products: [],
          };
        }

        matchesMap[product.tenant_id].score += score;

        matchesMap[product.tenant_id].products.push({
          id: product.id,
          title: product.title,
          category: product.category,
        });
      }
    });

    const matches = Object.values(matchesMap)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.json({ matches });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Errore caricamento match partnership",
    });
  }
});

app.post("/api/vendor/partnerships", authMiddleware, async (req, res) => {
  const { receiver_tenant_id, title, message } = req.body;

  if (!receiver_tenant_id || !title || !message) {
    return res.status(400).json({ error: "Campi obbligatori mancanti" });
  }

  try {
    const vendorId = req.user.userId;
    const requesterTenantId = req.user.tenantId;

    if (!vendorId || !requesterTenantId) {
      return res.status(404).json({ error: "Store mittente non trovato" });
    }

    if (Number(receiver_tenant_id) === Number(requesterTenantId)) {
      return res.status(400).json({
        error: "Non puoi proporre una partnership al tuo stesso store",
      });
    }

    const receiverUserResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE tenant_id = $1 AND role <> 'admin'
      ORDER BY id ASC
      LIMIT 1
      `,
      [receiver_tenant_id]
    );

    if (!receiverUserResult.rows.length) {
      return res.status(404).json({
        error: "Venditore destinatario non trovato",
      });
    }

    const receiverVendorId = receiverUserResult.rows[0].id;

    const result = await pool.query(
      `
      INSERT INTO vendor_partnerships (
        requester_vendor_id,
        receiver_vendor_id,
        requester_tenant_id,
        receiver_tenant_id,
        title,
        message,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,'pending')
      RETURNING *
      `,
      [
        vendorId,
        receiverVendorId,
        requesterTenantId,
        receiver_tenant_id,
        title,
        message,
      ]
    );

    return res.json({ partnership: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Errore creazione partnership",
    });
  }
});

app.get("/api/vendor/partnerships", authMiddleware, async (req, res) => {
  try {
    const vendorId = req.user.userId;

    const result = await pool.query(
      `
      SELECT
        vp.*,
        rt.name AS receiver_store_name,
        st.name AS sender_store_name
      FROM vendor_partnerships vp
      LEFT JOIN tenants rt ON rt.id = vp.receiver_tenant_id
      LEFT JOIN tenants st ON st.id = vp.requester_tenant_id
      WHERE
        vp.requester_vendor_id = $1
        OR vp.receiver_vendor_id = $1
      ORDER BY vp.created_at DESC
      `,
      [vendorId]
    );

    return res.json({ partnerships: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Errore caricamento partnership",
    });
  }
});

app.patch("/api/vendor/partnerships/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;

  if (!["accepted", "declined", "closed"].includes(status)) {
    return res.status(400).json({ error: "Status non valido" });
  }

  try {
    const vendorId = req.user.userId;

    const result = await pool.query(
      `
      UPDATE vendor_partnerships
      SET
        status = $1,
        updated_at = NOW()
      WHERE
        id = $2
        AND receiver_vendor_id = $3
      RETURNING *
      `,
      [status, req.params.id, vendorId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Partnership non trovata",
      });
    }

    return res.json({ partnership: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Errore aggiornamento partnership",
    });
  }
});

/* =======================================================
   VENDOR PRODUCTS
======================================================= */

app.get("/api/vendor/products", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      `
      SELECT *
      FROM products
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento prodotti" });
  }
});

app.get("/api/vendor/products/:id", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const productId = Number(req.params.id);

    const result = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = $1 AND tenant_id = $2
      `,
      [productId, tenantId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento prodotto" });
  }
});

app.patch("/api/vendor/products/:id", authMiddleware, async (req, res) => {
  const productId = Number(req.params.id);
  const tenantId = req.user.tenantId;

  const {
    title,
    description,
    price,
    category,
    tags,
    sku,
    stock,
    compare_at_price,
    sale_price,
    status,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE products
      SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        category = COALESCE($4, category),
        tags = COALESCE($5, tags),
        sku = COALESCE($6, sku),
        stock = COALESCE($7, stock),
        compare_at_price = $8,
        sale_price = $9,
        status = COALESCE($10, status),
        slug = COALESCE($11, slug)
      WHERE id = $12 AND tenant_id = $13
      RETURNING *
      `,
      [
        title ?? null,
        description ?? null,
        price !== undefined ? Number(price) : null,
        category ?? null,
        tags !== undefined ? parseTags(tags) : null,
        sku ?? null,
        stock !== undefined ? Number(stock) : null,
        compare_at_price === "" ? null : compare_at_price !== undefined ? Number(compare_at_price) : null,
        sale_price === "" ? null : sale_price !== undefined ? Number(sale_price) : null,
        status ?? null,
        title ? slugify(title) : null,
        productId,
        tenantId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    res.json({
      message: "Prodotto aggiornato correttamente",
      product: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore aggiornamento prodotto" });
  }
});

app.post("/api/vendor/products", authMiddleware, async (req, res) => {
  const {
    title,
    description,
    price,
    category,
    tags,
    sku,
    stock,
    compare_at_price,
    sale_price,
  } = req.body;

  try {
  const tenantId = req.user.tenantId;
  const slug = slugify(title);

  const embeddingText = `
${title}
${description || ""}
${category || ""}
${tags || ""}
`;

  const embedding =
    await createEmbedding(embeddingText);

  const result = await pool.query(
    `
    INSERT INTO products (
      tenant_id,
      title,
      slug,
      description,
      price,
      status,
      category,
      tags,
      sku,
      stock,
      compare_at_price,
      sale_price,
      embedding
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,$12,$13
    )
    RETURNING *
    `,
    [
      tenantId,
      title,
      slug,
      description || "",
      Number(price),
      "draft",
      category || "",
      parseTags(tags),
      sku || "",
      Number(stock || 0),
      compare_at_price
        ? Number(compare_at_price)
        : null,
      sale_price
        ? Number(sale_price)
        : null,
      JSON.stringify(embedding),
    ]
  );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore creazione prodotto" });
  }
});

app.patch("/api/vendor/products/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;

  try {
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      `
      UPDATE products
      SET status = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING *
      `,
      [status, req.params.id, tenantId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore aggiornamento stato prodotto" });
  }
});

app.delete("/api/vendor/products/:id", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
      `,
      [req.params.id, tenantId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore eliminazione prodotto" });
  }
});

app.post(
  "/api/vendor/products/:id/image",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    const tenantId = req.user.tenantId;
    const productId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: "Nessun file caricato" });
    }

    const imageUrl = `http://localhost:9000/uploads/${req.file.filename}`;

    try {
      const result = await pool.query(
        `
        UPDATE products
        SET image_url = $1
        WHERE id = $2 AND tenant_id = $3
        RETURNING *
        `,
        [imageUrl, productId, tenantId]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "Prodotto non trovato" });
      }

      res.json({
        message: "Immagine caricata correttamente",
        product: result.rows[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Errore upload immagine" });
    }
  }
);

/* =======================================================
   CSV EXPORT / IMPORT
======================================================= */

app.get("/api/vendor/products/export/csv", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      `
      SELECT
        title,
        description,
        price,
        category,
        tags,
        sku,
        stock,
        compare_at_price,
        sale_price,
        status,
        image_url
      FROM products
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    const fields = [
      "title",
      "description",
      "price",
      "category",
      "tags",
      "sku",
      "stock",
      "compare_at_price",
      "sale_price",
      "status",
      "image_url",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(result.rows);

    res.header("Content-Type", "text/csv");
    res.attachment("catalog-export.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore export CSV" });
  }
});

app.get("/api/vendor/products/template/csv", authMiddleware, async (_req, res) => {
  try {
    const fields = [
      "title",
      "description",
      "price",
      "category",
      "tags",
      "sku",
      "stock",
      "compare_at_price",
      "sale_price",
      "status",
      "image_url",
    ];

    const sampleRows = [
      {
        title: "T-shirt Booster",
        description: "T-shirt premium in cotone",
        price: 29.99,
        category: "Abbigliamento",
        tags: "tshirt, cotone, premium",
        sku: "TSHIRT-001",
        stock: 25,
        compare_at_price: 39.99,
        sale_price: 29.99,
        status: "published",
        image_url: "",
      },
      {
        title: "Felpa Logo",
        description: "Felpa con cappuccio unisex",
        price: 49.99,
        category: "Abbigliamento",
        tags: "felpa, hoodie, logo",
        sku: "HOODIE-001",
        stock: 10,
        compare_at_price: "",
        sale_price: "",
        status: "draft",
        image_url: "",
      },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(sampleRows);

    res.header("Content-Type", "text/csv");
    res.attachment("catalog-template.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore generazione template CSV" });
  }
});

app.post(
  "/api/vendor/products/import/csv",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    const tenantId = req.user.tenantId;

    if (!req.file) {
      return res.status(400).json({ error: "Nessun CSV caricato" });
    }

    try {
      const filePath = path.join(__dirname, "uploads", req.file.filename);
      const fileContent = fs.readFileSync(filePath, "utf8");

      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      let imported = 0;
      const errors = [];

      for (let i = 0; i < records.length; i++) {
        const row = records[i];

        try {
          if (!row.title || row.price === undefined || row.price === "") {
            errors.push(`Riga ${i + 2}: title e price sono obbligatori`);
            continue;
          }

          const title = row.title;
          const description = row.description || "";
          const price = Number(row.price);
          const category = row.category || "";
          const tags = parseTags(row.tags || "");
          const sku = row.sku || "";
          const stock = toIntegerOrZero(row.stock);
          const compareAtPrice = toNumberOrNull(row.compare_at_price);
          const salePrice = toNumberOrNull(row.sale_price);
          const status = normalizeStatus(row.status);
          const imageUrl = row.image_url || "";
          const slug = slugify(title);

          if (Number.isNaN(price)) {
            errors.push(`Riga ${i + 2}: price non valido`);
            continue;
          }

          await pool.query(
            `
            INSERT INTO products (
              tenant_id,
              title,
              slug,
              description,
              price,
              status,
              category,
              tags,
              sku,
              stock,
              compare_at_price,
              sale_price,
              image_url
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            `,
            [
              tenantId,
              title,
              slug,
              description,
              price,
              status,
              category,
              tags,
              sku,
              stock,
              compareAtPrice,
              salePrice,
              imageUrl,
            ]
          );

          imported += 1;
        } catch (rowError) {
          console.error(rowError);
          errors.push(`Riga ${i + 2}: errore import`);
        }
      }

      res.json({
        message: "Import CSV completato",
        imported,
        errors,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Errore import CSV" });
    }
  }
);

/* =======================================================
   VENDOR ORDERS
======================================================= */

app.get("/api/vendor/orders", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      `,
      [tenantId]
    );

    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento ordini vendor" });
  }
});

app.get("/api/vendor/orders/:id", authMiddleware, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const orderId = Number(req.params.id);

    const orderResult = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1 AND tenant_id = $2
      `,
      [orderId, tenantId]
    );

    if (!orderResult.rows.length) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    const itemsResult = await pool.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [orderId]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore dettaglio ordine vendor" });
  }
});

app.patch("/api/vendor/orders/:id/status", authMiddleware, async (req, res) => {
  const orderId = Number(req.params.id);
  const { status, payment_status } = req.body;

  try {
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      `
      UPDATE orders
      SET
        status = COALESCE($1, status),
        payment_status = COALESCE($2, payment_status)
      WHERE id = $3 AND tenant_id = $4
      RETURNING *
      `,
      [status || null, payment_status || null, orderId, tenantId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    res.json({
      message: "Ordine aggiornato",
      order: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore aggiornamento ordine" });
  }
});

/* =======================================================
   CUSTOMER AREA
======================================================= */

app.get("/api/customers/me", customerAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, email, name, phone, default_shipping_address, created_at
      FROM customers
      WHERE id = $1
      `,
      [req.customer.customerId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }

    res.json({ customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento profilo" });
  }
});

app.patch("/api/customers/me", customerAuth, async (req, res) => {
  const { name, phone, default_shipping_address } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE customers
      SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        default_shipping_address = COALESCE($3, default_shipping_address)
      WHERE id = $4
      RETURNING id, email, name, phone, default_shipping_address, created_at
      `,
      [
        name ?? null,
        phone ?? null,
        default_shipping_address ?? null,
        req.customer.customerId,
      ]
    );

    res.json({
      message: "Profilo aggiornato",
      customer: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore aggiornamento profilo" });
  }
});

app.get("/api/customers/me/addresses", customerAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM customer_addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, created_at DESC
      `,
      [req.customer.customerId]
    );

    res.json({ addresses: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento indirizzi" });
  }
});

app.post("/api/customers/me/addresses", customerAuth, async (req, res) => {
  const {
    label,
    full_name,
    phone,
    address_line,
    city,
    postal_code,
    country,
    is_default,
  } = req.body;

  if (!label || !address_line) {
    return res
      .status(400)
      .json({ error: "label e address_line sono obbligatori" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (is_default) {
      await client.query(
        `
        UPDATE customer_addresses
        SET is_default = FALSE
        WHERE customer_id = $1
        `,
        [req.customer.customerId]
      );
    }

    const result = await client.query(
      `
      INSERT INTO customer_addresses (
        customer_id,
        label,
        full_name,
        phone,
        address_line,
        city,
        postal_code,
        country,
        is_default
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        req.customer.customerId,
        label,
        full_name || "",
        phone || "",
        address_line,
        city || "",
        postal_code || "",
        country || "",
        !!is_default,
      ]
    );

    if (is_default) {
      await client.query(
        `
        UPDATE customers
        SET
          phone = COALESCE(NULLIF($1, ''), phone),
          default_shipping_address = $2
        WHERE id = $3
        `,
        [
          phone || "",
          [address_line, city, postal_code, country].filter(Boolean).join(", "),
          req.customer.customerId,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      message: "Indirizzo creato",
      address: result.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Errore creazione indirizzo" });
  } finally {
    client.release();
  }
});

app.delete("/api/customers/me/addresses/:id", customerAuth, async (req, res) => {
  const addressId = Number(req.params.id);

  try {
    const result = await pool.query(
      `
      DELETE FROM customer_addresses
      WHERE id = $1 AND customer_id = $2
      RETURNING *
      `,
      [addressId, req.customer.customerId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Indirizzo non trovato" });
    }

    res.json({ message: "Indirizzo eliminato" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore eliminazione indirizzo" });
  }
});

app.get("/api/customers/me/orders", customerAuth, async (req, res) => {
  try {
    const email = req.customer.email;

    const result = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE customer_email = $1
      ORDER BY created_at DESC
      `,
      [email]
    );

    res.json({ orders: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento ordini" });
  }
});

app.get("/api/customers/me/orders/:id", customerAuth, async (req, res) => {
  const orderId = Number(req.params.id);

  try {
    const email = req.customer.email;

    const orderResult = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1 AND customer_email = $2
      `,
      [orderId, email]
    );

    if (!orderResult.rows.length) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    const itemsResult = await pool.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [orderId]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento dettaglio ordine" });
  }
});

/* =======================================================
   PUBLIC PRODUCTS / STORES
======================================================= */

app.get("/api/public/products", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        products.*,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM products
      JOIN tenants ON products.tenant_id = tenants.id
      WHERE products.status = 'published'
      ORDER BY products.created_at DESC
    `);

    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento prodotti pubblici" });
  }
});

app.get("/api/public/products/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        products.*,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM products
      JOIN tenants ON products.tenant_id = tenants.id
      WHERE products.id = $1 AND products.status = 'published'
      `,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    res.json({ product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento prodotto" });
  }
});

app.get("/api/public/stores/:slug", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM tenants
      WHERE slug = $1
      `,
      [req.params.slug]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Store non trovato" });
    }

    res.json({ store: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento store" });
  }
});

app.get("/api/public/stores/:slug/products", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        products.*,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM products
      JOIN tenants ON products.tenant_id = tenants.id
      WHERE tenants.slug = $1 AND products.status = 'published'
      ORDER BY products.created_at DESC
      `,
      [req.params.slug]
    );

    res.json({ products: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento prodotti store" });
  }
});

/* =======================================================
   PUBLIC CHECKOUT
======================================================= */

app.post("/api/public/checkout", async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    notes,
    items,
  } = req.body;

  if (!customer_name || !customer_email || !shipping_address) {
    return res.status(400).json({
      error: "customer_name, customer_email e shipping_address sono obbligatori",
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Il carrello è vuoto" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let total = 0;
    let createdOrderId = null;
    let tenantId = null;

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity || 1);

      if (!productId || quantity <= 0) {
        throw new Error("Item non valido nel carrello");
      }

      const productResult = await client.query(
        `
        SELECT *
        FROM products
        WHERE id = $1 AND status = 'published'
        `,
        [productId]
      );

      if (!productResult.rows.length) {
        throw new Error(`Prodotto ${productId} non trovato`);
      }

      const product = productResult.rows[0];

      if (product.stock !== null && product.stock < quantity) {
        throw new Error(`Stock insufficiente per ${product.title}`);
      }

      if (!createdOrderId) {
        tenantId = product.tenant_id;

        const orderResult = await client.query(
          `
          INSERT INTO orders (
            tenant_id,
            customer_name,
            customer_email,
            customer_phone,
            shipping_address,
            notes,
            total,
            status,
            payment_status
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          RETURNING *
          `,
          [
            tenantId,
            customer_name,
            customer_email,
            customer_phone || "",
            shipping_address,
            notes || "",
            0,
            "pending",
            "pending",
          ]
        );

        createdOrderId = orderResult.rows[0].id;
      }

      if (tenantId !== product.tenant_id) {
        throw new Error("Il checkout supporta un solo venditore per ordine");
      }

      const unitPrice = product.sale_price || product.price;
      const lineTotal = Number(unitPrice) * quantity;
      total += lineTotal;

      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          tenant_id,
          title,
          price,
          quantity,
          image_url
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [
          createdOrderId,
          product.id,
          product.tenant_id,
          product.title,
          unitPrice,
          quantity,
          product.image_url || "",
        ]
      );

      await client.query(
        `
        UPDATE products
        SET stock = GREATEST(stock - $1, 0)
        WHERE id = $2
        `,
        [quantity, product.id]
      );
    }

    await client.query(
      `
      UPDATE orders
      SET total = $1
      WHERE id = $2
      `,
      [total, createdOrderId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Ordine creato correttamente",
      order_id: createdOrderId,
      total,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message || "Errore creazione ordine" });
  } finally {
    client.release();
  }
});

app.get("/api/public/orders/:id", async (req, res) => {
  const orderId = Number(req.params.id);

  try {
    const orderResult = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    );

    if (!orderResult.rows.length) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    const itemsResult = await pool.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [orderId]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore caricamento ordine" });
  }
});

/* =======================================================
   STRIPE CHECKOUT
======================================================= */

app.post("/api/stripe/checkout", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe non configurato" });
    }

    const { items, customer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrello vuoto" });
    }

    if (!process.env.FRONTEND_URL) {
      return res.status(500).json({ error: "FRONTEND_URL mancante" });
    }

    const normalizedItems = items.map((item) => {
      const rawPrice = item.sale_price ?? item.price;
      const price = Number(rawPrice);
      const quantity = Number(item.quantity || 1);
      const productId = Number(item.product_id);

      if (!item.title) {
        throw new Error("Titolo prodotto mancante");
      }

      if (!productId) {
        throw new Error(`product_id mancante per ${item.title}`);
      }

      if (Number.isNaN(price) || price <= 0) {
        throw new Error(`Prezzo non valido per ${item.title}: ${rawPrice}`);
      }

      if (Number.isNaN(quantity) || quantity <= 0) {
        throw new Error(`Quantità non valida per ${item.title}: ${item.quantity}`);
      }

      return {
        product_id: productId,
        title: String(item.title),
        price,
        quantity,
      };
    });

    const line_items = normalizedItems.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      metadata: {
        customer_name: String(customer?.name || ""),
        customer_email: String(customer?.email || ""),
        customer_phone: String(customer?.phone || ""),
        shipping_address: String(customer?.shipping_address || ""),
        notes: String(customer?.notes || ""),
        items_json: JSON.stringify(
          normalizedItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          }))
        ),
      },
      success_url: `${process.env.FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("STRIPE CHECKOUT ERROR:", err);
    return res.status(500).json({
      error: err.message || "Errore Stripe checkout",
    });
  }
});
/* =======================================================
   PASSWORD RESET
======================================================= */


app.post("/api/password/forgot", async (req, res) => {
  const { email, user_type } = req.body;

  if (!email || !user_type) {
    return res.status(400).json({ error: "email e user_type sono obbligatori" });
  }

  if (!["customer", "vendor"].includes(user_type)) {
    return res.status(400).json({ error: "user_type non valido" });
  }

  try {
    let userResult;

    if (user_type === "customer") {
      userResult = await pool.query(
        "SELECT id, email FROM customers WHERE email = $1",
        [email]
      );
    } else {
      userResult = await pool.query(
        "SELECT id, email FROM users WHERE email = $1",
        [email]
      );
    }

    if (!userResult.rows.length) {
      return res.json({
        message: "Se l'account esiste, riceverai le istruzioni di reset",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await pool.query(
      `
      INSERT INTO password_resets (email, user_type, token, expires_at, used)
      VALUES ($1, $2, $3, $4, FALSE)
      `,
      [email, user_type, token, expiresAt]
    );

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetPath =
      user_type === "customer"
        ? `/customer/reset-password?token=${token}`
        : `/reset-password?token=${token}`;

    const resetUrl = `${baseUrl}${resetPath}`;

    console.log("RESET PASSWORD LINK:");
    console.log(resetUrl);

    try {
      await sendPasswordResetEmail({
        to: email,
        resetUrl,
      });
    } catch (e) {
      console.error("RESET EMAIL ERROR:", e.message);
    }

    return res.json({
      message: "Se l'account esiste, riceverai le istruzioni di reset",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Errore richiesta reset password" });
  }
});

/* =======================================================
   START
======================================================= */

/* =======================================================
   ADMIN
======================================================= */

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM users
      WHERE email = $1 AND role = 'admin'
      `,
      [email]
    );

    const admin = result.rows[0];

    if (!admin) {
      return res.status(400).json({ error: "Admin non trovato" });
    }

    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Password errata" });
    }

    const token = jwt.sign(
      {
        userId: admin.id,
        role: admin.role,
      },
      "super-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login admin ok",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore login admin" });
  }
});

app.get("/api/admin/overview", adminAuth, async (_req, res) => {
  try {
    const vendorsResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role <> 'admin'"
    );

    const adminsResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'admin'"
    );

    const customersResult = await pool.query(
      "SELECT COUNT(*) FROM customers"
    );

    const productsResult = await pool.query(
      "SELECT COUNT(*) FROM products"
    );

    const publishedProductsResult = await pool.query(
      "SELECT COUNT(*) FROM products WHERE status = 'published'"
    );

    const ordersResult = await pool.query(
      "SELECT COUNT(*) FROM orders"
    );

    const storesResult = await pool.query(
      "SELECT COUNT(*) FROM tenants"
    );

    res.json({
      stats: {
        vendors: Number(vendorsResult.rows[0].count),
        admins: Number(adminsResult.rows[0].count),
        customers: Number(customersResult.rows[0].count),
        stores: Number(storesResult.rows[0].count),
        products: Number(productsResult.rows[0].count),
        publishedProducts: Number(publishedProductsResult.rows[0].count),
        orders: Number(ordersResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore overview admin" });
  }
});

app.get("/api/admin/vendors", adminAuth, async (_req, res) => {
  app.get("/api/admin/vendors/:id", adminAuth, async (req, res) => {
  const vendorId = Number(req.params.id);

  try {
    const result = await pool.query(
      `
      SELECT
        users.id,
        users.email,
        users.role,
        users.created_at,
        users.tenant_id,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM users
      LEFT JOIN tenants ON users.tenant_id = tenants.id
      WHERE users.id = $1 AND users.role <> 'admin'
      `,
      [vendorId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Venditore non trovato" });
    }

    res.json({ vendor: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento venditore" });
  }
});

app.patch("/api/admin/vendors/:id", adminAuth, async (req, res) => {
  const vendorId = Number(req.params.id);
  const { email, store_name, store_slug } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const vendorResult = await client.query(
      `
      SELECT *
      FROM users
      WHERE id = $1 AND role <> 'admin'
      `,
      [vendorId]
    );

    if (!vendorResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Venditore non trovato" });
    }

    const vendor = vendorResult.rows[0];

    if (email) {
      const existingEmail = await client.query(
        `
        SELECT id
        FROM users
        WHERE email = $1 AND id <> $2
        `,
        [email, vendorId]
      );

      if (existingEmail.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Email già in uso" });
      }

      await client.query(
        `
        UPDATE users
        SET email = $1
        WHERE id = $2
        `,
        [email, vendorId]
      );
    }

    if (vendor.tenant_id && (store_name || store_slug)) {
      if (store_slug) {
        const existingSlug = await client.query(
          `
          SELECT id
          FROM tenants
          WHERE slug = $1 AND id <> $2
          `,
          [store_slug, vendor.tenant_id]
        );

        if (existingSlug.rows.length) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Slug negozio già esistente" });
        }
      }

      await client.query(
        `
        UPDATE tenants
        SET
          name = COALESCE($1, name),
          slug = COALESCE($2, slug)
        WHERE id = $3
        `,
        [store_name || null, store_slug || null, vendor.tenant_id]
      );
    }

    const updatedResult = await client.query(
      `
      SELECT
        users.id,
        users.email,
        users.role,
        users.created_at,
        users.tenant_id,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM users
      LEFT JOIN tenants ON users.tenant_id = tenants.id
      WHERE users.id = $1
      `,
      [vendorId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Venditore aggiornato correttamente",
      vendor: updatedResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento venditore" });
  } finally {
    client.release();
  }
});

app.delete("/api/admin/vendors/:id", adminAuth, async (req, res) => {
  const vendorId = Number(req.params.id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const vendorResult = await client.query(
      `
      SELECT *
      FROM users
      WHERE id = $1 AND role <> 'admin'
      `,
      [vendorId]
    );

    if (!vendorResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Venditore non trovato" });
    }

    const vendor = vendorResult.rows[0];

    await client.query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [vendorId]
    );

    if (vendor.tenant_id) {
      await client.query(
        `
        DELETE FROM tenants
        WHERE id = $1
        `,
        [vendor.tenant_id]
      );
    }

    await client.query("COMMIT");

    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Errore eliminazione venditore" });
  } finally {
    client.release();
  }
});
  try {
    const result = await pool.query(`
      SELECT
        users.id,
        users.email,
        users.role,
        users.created_at,
        tenants.id AS tenant_id,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM users
      LEFT JOIN tenants ON users.tenant_id = tenants.id
      WHERE users.role <> 'admin'
      ORDER BY users.created_at DESC
    `);

    res.json({ vendors: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento vendors" });
  }
});

app.get("/api/admin/vendors/:id", adminAuth, async (req, res) => {
  const vendorId = Number(req.params.id);

  try {
    const result = await pool.query(
      `
      SELECT
        users.id,
        users.email,
        users.role,
        users.created_at,
        users.tenant_id,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM users
      LEFT JOIN tenants ON users.tenant_id = tenants.id
      WHERE users.id = $1 AND users.role <> 'admin'
      `,
      [vendorId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Venditore non trovato" });
    }

    res.json({ vendor: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento venditore" });
  }
});

app.patch("/api/admin/vendors/:id", adminAuth, async (req, res) => {
  const vendorId = Number(req.params.id);
  const { email, store_name, store_slug, role } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const vendorResult = await client.query(
      `
      SELECT *
      FROM users
      WHERE id = $1 AND role <> 'admin'
      `,
      [vendorId]
    );

    if (!vendorResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Venditore non trovato" });
    }

    const vendor = vendorResult.rows[0];

    if (email) {
      const existingEmail = await client.query(
        `
        SELECT id
        FROM users
        WHERE email = $1 AND id <> $2
        `,
        [email, vendorId]
      );

      if (existingEmail.rows.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Email già in uso" });
      }
    }

    await client.query(
      `
      UPDATE users
      SET
        email = COALESCE($1, email),
        role = COALESCE($2, role)
      WHERE id = $3
      `,
      [email ?? null, role ?? null, vendorId]
    );

    if (vendor.tenant_id) {
      if (store_slug) {
        const existingSlug = await client.query(
          `
          SELECT id
          FROM tenants
          WHERE slug = $1 AND id <> $2
          `,
          [store_slug, vendor.tenant_id]
        );

        if (existingSlug.rows.length) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "Slug negozio già esistente" });
        }
      }

      await client.query(
        `
        UPDATE tenants
        SET
          name = COALESCE($1, name),
          slug = COALESCE($2, slug)
        WHERE id = $3
        `,
        [store_name ?? null, store_slug ?? null, vendor.tenant_id]
      );
    }

    const updatedResult = await client.query(
      `
      SELECT
        users.id,
        users.email,
        users.role,
        users.created_at,
        users.tenant_id,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM users
      LEFT JOIN tenants ON users.tenant_id = tenants.id
      WHERE users.id = $1
      `,
      [vendorId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Venditore aggiornato correttamente",
      vendor: updatedResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento venditore" });
  } finally {
    client.release();
  }
});

app.delete("/api/admin/vendors/:id", adminAuth, async (req, res) => {
  const vendorId = Number(req.params.id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const vendorResult = await client.query(
      `
      SELECT *
      FROM users
      WHERE id = $1 AND role <> 'admin'
      `,
      [vendorId]
    );

    if (!vendorResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Venditore non trovato" });
    }

    const vendor = vendorResult.rows[0];

    await client.query(
      `
      DELETE FROM users
      WHERE id = $1
      `,
      [vendorId]
    );

    if (vendor.tenant_id) {
      await client.query(
        `
        DELETE FROM tenants
        WHERE id = $1
        `,
        [vendor.tenant_id]
      );
    }

    await client.query("COMMIT");

    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Errore eliminazione venditore" });
  } finally {
    client.release();
  }
});

app.get("/api/admin/customers", adminAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        email,
        name,
        phone,
        default_shipping_address,
        created_at
      FROM customers
      ORDER BY created_at DESC
    `);

    res.json({ customers: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento customers" });
  }
});

app.get("/api/admin/customers/:id", adminAuth, async (req, res) => {
  const customerId = Number(req.params.id);

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        email,
        name,
        phone,
        default_shipping_address,
        created_at
      FROM customers
      WHERE id = $1
      `,
      [customerId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }

    res.json({ customer: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento cliente" });
  }
});

app.patch("/api/admin/customers/:id", adminAuth, async (req, res) => {
  const customerId = Number(req.params.id);
  const { email, name, phone, default_shipping_address } = req.body;

  try {
    if (email) {
      const existingEmail = await pool.query(
        `
        SELECT id
        FROM customers
        WHERE email = $1 AND id <> $2
        `,
        [email, customerId]
      );

      if (existingEmail.rows.length) {
        return res.status(400).json({ error: "Email già in uso" });
      }
    }

    const result = await pool.query(
      `
      UPDATE customers
      SET
        email = COALESCE($1, email),
        name = COALESCE($2, name),
        phone = COALESCE($3, phone),
        default_shipping_address = COALESCE($4, default_shipping_address)
      WHERE id = $5
      RETURNING
        id,
        email,
        name,
        phone,
        default_shipping_address,
        created_at
      `,
      [
        email ?? null,
        name ?? null,
        phone ?? null,
        default_shipping_address ?? null,
        customerId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }

    res.json({
      message: "Cliente aggiornato correttamente",
      customer: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento cliente" });
  }
});

app.delete("/api/admin/customers/:id", adminAuth, async (req, res) => {
  const customerId = Number(req.params.id);

  try {
    const result = await pool.query(
      `
      DELETE FROM customers
      WHERE id = $1
      RETURNING id
      `,
      [customerId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore eliminazione cliente" });
  }
});

app.get("/api/admin/orders", adminAuth, async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `);

    res.json({ orders: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento ordini admin" });
  }
});
app.get("/api/admin/orders/:id", adminAuth, async (req, res) => {
  const orderId = Number(req.params.id);

  try {
    const orderResult = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    );

    if (!orderResult.rows.length) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    const itemsResult = await pool.query(
      `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [orderId]
    );

    res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore dettaglio ordine admin" });
  }
});
app.patch("/api/admin/orders/:id", adminAuth, async (req, res) => {
  const orderId = Number(req.params.id);

  const {
    status,
    payment_status,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    notes,
  } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE orders
      SET
        status = COALESCE($1, status),
        payment_status = COALESCE($2, payment_status),
        customer_name = COALESCE($3, customer_name),
        customer_email = COALESCE($4, customer_email),
        customer_phone = COALESCE($5, customer_phone),
        shipping_address = COALESCE($6, shipping_address),
        notes = COALESCE($7, notes)
      WHERE id = $8
      RETURNING *
      `,
      [
        status ?? null,
        payment_status ?? null,
        customer_name ?? null,
        customer_email ?? null,
        customer_phone ?? null,
        shipping_address ?? null,
        notes ?? null,
        orderId,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento ordine admin" });
  }
});

app.delete("/api/admin/orders/:id", adminAuth, async (req, res) => {
  const orderId = Number(req.params.id);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      `
      SELECT id
      FROM orders
      WHERE id = $1
      `,
      [orderId]
    );

    if (!orderResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Ordine non trovato" });
    }

    await client.query(
      `
      DELETE FROM order_items
      WHERE order_id = $1
      `,
      [orderId]
    );

    await client.query(
      `
      DELETE FROM orders
      WHERE id = $1
      `,
      [orderId]
    );

    await client.query("COMMIT");

    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Errore eliminazione ordine admin" });
  } finally {
    client.release();
  }
});

/* =======================================================
   AI CHAT
======================================================= */

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;

  return parts[1];
}

async function buildAiContext({ reqRole, token }) {
  const context = {
    role: reqRole || "guest",
    live: {},
  };

  if (!token) {
    return context;
  }

  try {
    if (reqRole === "vendor") {
      const decoded = jwt.verify(token, "super-secret-key");

      if (decoded.role !== "owner" && decoded.role !== "vendor") {
        return context;
      }

      const tenantId = decoded.tenantId;

      const [productsCount, publishedProducts, ordersCount, lastOrders] =
        await Promise.all([
          pool.query(
            "SELECT COUNT(*) FROM products WHERE tenant_id = $1",
            [tenantId]
          ),
          pool.query(
            "SELECT COUNT(*) FROM products WHERE tenant_id = $1 AND status = 'published'",
            [tenantId]
          ),
          pool.query(
            "SELECT COUNT(*) FROM orders WHERE tenant_id = $1",
            [tenantId]
          ),
          pool.query(
            `
            SELECT id, total, status, payment_status, created_at
            FROM orders
            WHERE tenant_id = $1
            ORDER BY created_at DESC
            LIMIT 3
            `,
            [tenantId]
          ),
        ]);

      context.live = {
        tenantId,
        products: Number(productsCount.rows[0].count),
        publishedProducts: Number(publishedProducts.rows[0].count),
        orders: Number(ordersCount.rows[0].count),
        latestOrders: lastOrders.rows,
      };

      return context;
    }

    if (reqRole === "customer") {
      const decoded = jwt.verify(token, "customer-secret");

      const customerResult = await pool.query(
        `
        SELECT id, email, name, phone, default_shipping_address
        FROM customers
        WHERE id = $1
        `,
        [decoded.customerId]
      );

      if (!customerResult.rows.length) {
        return context;
      }

      const customer = customerResult.rows[0];

      const [ordersCount, lastOrders] = await Promise.all([
        pool.query(
          "SELECT COUNT(*) FROM orders WHERE customer_email = $1",
          [customer.email]
        ),
        pool.query(
          `
          SELECT id, total, status, payment_status, created_at
          FROM orders
          WHERE customer_email = $1
          ORDER BY created_at DESC
          LIMIT 3
          `,
          [customer.email]
        ),
      ]);

      context.live = {
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          default_shipping_address: customer.default_shipping_address,
        },
        orders: Number(ordersCount.rows[0].count),
        latestOrders: lastOrders.rows,
      };

      return context;
    }

    if (reqRole === "admin") {
      const decoded = jwt.verify(token, "super-secret-key");

      if (decoded.role !== "admin") {
        return context;
      }

      const [
        vendorsCount,
        customersCount,
        storesCount,
        productsCount,
        publishedProductsCount,
        ordersCount,
      ] = await Promise.all([
        pool.query("SELECT COUNT(*) FROM users WHERE role <> 'admin'"),
        pool.query("SELECT COUNT(*) FROM customers"),
        pool.query("SELECT COUNT(*) FROM tenants"),
        pool.query("SELECT COUNT(*) FROM products"),
        pool.query("SELECT COUNT(*) FROM products WHERE status = 'published'"),
        pool.query("SELECT COUNT(*) FROM orders"),
      ]);

      context.live = {
        vendors: Number(vendorsCount.rows[0].count),
        customers: Number(customersCount.rows[0].count),
        stores: Number(storesCount.rows[0].count),
        products: Number(productsCount.rows[0].count),
        publishedProducts: Number(publishedProductsCount.rows[0].count),
        orders: Number(ordersCount.rows[0].count),
      };

      return context;
    }

    return context;
  } catch (error) {
    console.error("AI CONTEXT ERROR:", error.message);
    return context;
  }
}

function parseCatalogFilters(message) {
  const raw = String(message || "").toLowerCase();

  let maxPrice = null;
  let minPrice = null;
  let onlyAvailable = false;

  const underMatch = raw.match(/(?:sotto|meno di|max|massimo)\s*€?\s*(\d+)/);
  if (underMatch) maxPrice = Number(underMatch[1]);

  const overMatch = raw.match(/(?:sopra|più di|min|minimo)\s*€?\s*(\d+)/);
  if (overMatch) minPrice = Number(overMatch[1]);

  if (
    raw.includes("disponibile") ||
    raw.includes("disponibili") ||
    raw.includes("in stock") ||
    raw.includes("a magazzino")
  ) {
    onlyAvailable = true;
  }

  return { maxPrice, minPrice, onlyAvailable };
}

function extractCatalogSearchTerms(message) {
  const raw = String(message || "").toLowerCase();

  const baseWords = raw
    .replace(/[^\w\sàèéìòù]/gi, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2)
    .filter(
      (w) =>
        ![
          "che",
          "cosa",
          "avete",
          "hai",
          "sono",
          "con",
          "per",
          "una",
          "uno",
          "dei",
          "del",
          "della",
          "disponibile",
          "disponibili",
          "catalogo",
          "prodotto",
          "prodotti",
          "mostrami",
          "cerco",
          "sotto",
          "meno",
          "massimo",
          "max",
          "sopra",
          "minimo",
          "min",
          "euro",
        ].includes(w)
    );

  const synonyms = [];

  if (raw.includes("moto") || raw.includes("motocicletta")) {
    synonyms.push(
      "moto",
      "motocicletta",
      "yamaha",
      "ducati",
      "honda",
      "kawasaki",
      "suzuki",
      "aprilia",
      "bmw",
      "r1",
      "r6",
      "cbr",
      "ninja",
      "panigale"
    );
  }

  if (raw.includes("abbigliamento")) {
    synonyms.push("tshirt", "t-shirt", "felpa", "maglia", "hoodie");
  }

  if (raw.includes("scarpe")) {
    synonyms.push("scarpe", "sneakers", "calzature");
  }

  return Array.from(new Set([...baseWords, ...synonyms])).slice(0, 12);
}

async function searchCatalogForAi(message) {
  const terms = extractCatalogSearchTerms(message);
  const filters = parseCatalogFilters(message);

  try {
    const whereParts = ["products.status = 'published'"];
    const values = [];
    let index = 1;

    if (terms.length) {
      const conditions = terms
        .map(() => {
          const param = `$${index++}`;
          return `
            products.title ILIKE ${param}
            OR products.description ILIKE ${param}
            OR products.category ILIKE ${param}
            OR products.tags ILIKE ${param}
            OR products.sku ILIKE ${param}
            OR tenants.name ILIKE ${param}
            OR tenants.slug ILIKE ${param}
          `;
        })
        .join(" OR ");

      whereParts.push(`(${conditions})`);
      values.push(...terms.map((term) => `%${term}%`));
    }

    if (filters.maxPrice !== null) {
      whereParts.push(
        `COALESCE(products.sale_price, products.price) <= $${index++}`
      );
      values.push(filters.maxPrice);
    }

    if (filters.minPrice !== null) {
      whereParts.push(
        `COALESCE(products.sale_price, products.price) >= $${index++}`
      );
      values.push(filters.minPrice);
    }

    if (filters.onlyAvailable) {
      whereParts.push(`COALESCE(products.stock, 0) > 0`);
    }

    const result = await pool.query(
      `
      SELECT
        products.id,
        products.title,
        products.description,
        products.price,
        products.sale_price,
        products.stock,
        products.category,
        products.tags,
        products.sku,
        products.image_url,
        tenants.name AS store_name,
        tenants.slug AS store_slug
      FROM products
      JOIN tenants ON products.tenant_id = tenants.id
      WHERE ${whereParts.join(" AND ")}
      ORDER BY
        COALESCE(products.sale_price, products.price) ASC,
        products.created_at DESC
      LIMIT 12
      `,
      values
    );

    return result.rows;
  } catch (error) {
    console.error("AI PRODUCT SEARCH ERROR:", error.message);
    return [];
  }
}

// ===============================
// AI PRODUCT SEMANTIC SEARCH
// ===============================

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (!normA || !normB) return 0;

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

app.post("/api/ai/product-search", async (req, res) => {
  const { query } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Query obbligatoria" });
  }

  try {
    const queryEmbedding = await createEmbedding(query);

    if (!queryEmbedding) {
      return res.status(500).json({
        error: "Embedding AI non disponibile",
      });
    }

    const result = await pool.query(`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.description,
        p.price,
        p.sale_price,
        p.image_url,
        p.category,
        p.tags,
        p.embedding,
        t.name AS store_name,
        t.slug AS store_slug
      FROM products p
      LEFT JOIN tenants t ON t.id = p.tenant_id
      WHERE p.status = 'published'
        AND p.embedding IS NOT NULL
    `);

    const products = result.rows
      .map((product) => {
        let productEmbedding = null;

        try {
          productEmbedding = JSON.parse(product.embedding);
        } catch {
          productEmbedding = null;
        }

        const similarity = cosineSimilarity(queryEmbedding, productEmbedding);

        return {
          ...product,
          embedding: undefined,
          similarity,
        };
      })
      .filter((product) => product.similarity > 0.15)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8);

    return res.json({
      products,
    });
  } catch (err) {
    console.error("AI PRODUCT SEARCH ERROR:", err);

    return res.status(500).json({
      error: "Errore ricerca AI prodotti",
    });
  }
});

app.post("/api/ai/chat", async (req, res) => {
  const { message, role, pathname, history } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: "Messaggio obbligatorio" });
  }

  if (!openai) {
    return res.status(500).json({ error: "OPENAI_API_KEY mancante" });
  }

  try {
    const safeRole = ["guest", "customer", "vendor", "admin"].includes(role)
      ? role
      : "guest";

    const safePathname = String(pathname || "/");
    const token = extractBearerToken(req);
    const liveContext = await buildAiContext({
      reqRole: safeRole,
      token,
    });
    const catalogMatches = await searchCatalogForAi(message);

    const systemPrompt = `
Sei Booster Assistant, l'assistente del portale Clients Booster.

Rispondi sempre in italiano.
Sii utile, chiaro, pratico, breve.
Non inventare funzioni non presenti.
Quando hai dati live nel contesto, usali.
Quando non hai dati sufficienti, dillo chiaramente.
Non parlare di implementazione tecnica interna, a meno che l'utente lo chieda.

Ruolo utente dichiarato: ${safeRole}
Pagina corrente: ${safePathname}

Funzionalità del portale:
- marketplace pubblico
- login cliente, venditore, admin
- checkout cliente
- area cliente con ordini, profilo e indirizzi
- area venditore con dashboard, prodotti e ordini
- area admin con overview, clienti, venditori e ordini
- chat Booster Assistant
- ticket supporto non ancora completi
- partnership venditore-venditore con matching tra store
- proposte private di collaborazione commerciale tra venditori
- bundle, cross-selling, referral e campagne comuni tra store

Contesto live:
${JSON.stringify(liveContext, null, 2)}

Prodotti trovati nel catalogo in base alla domanda:
${JSON.stringify(catalogMatches, null, 2)}

Regole:
- rispondi sempre in italiano, in modo naturale e commerciale
- se l'utente chiede "quanti ordini ho", usa il contesto live se presente
- se l'utente chiede "quanti prodotti ho", usa il contesto live venditore
- se l'utente chiede dati admin, usa il contesto live admin
- se il ruolo non consente accesso a certi dati, spiega il limite
- se l'utente chiede una procedura, rispondi per step semplici
- se l'utente chiede prodotti, modelli, prezzi, categorie, disponibilità o negozi, usa solo i prodotti trovati nel catalogo
- se non ci sono prodotti pertinenti nel catalogo, dillo chiaramente senza inventare alternative
- non inventare mai prodotti, prezzi, stock o negozi
- quando citi un prodotto, indica nome, prezzo, disponibilità e link markdown [Vedi prodotto](/products/ID)
- se sale_price è presente, usa sale_price come prezzo principale
- suggerisci alternative simili solo se sono presenti nei prodotti trovati
- fai domande utili per aiutare l'utente a scegliere
- se un venditore chiede partner, collaborazioni, bundle, cross-selling o strategie B2B, indirizzalo a /dashboard/partnerships
- spiega che nella pagina Partnership può vedere store compatibili, inviare proposte private, accettare o rifiutare partnership
- proponi idee concrete di collaborazione: bundle, promozioni incrociate, referral, eventi comuni, campagne marketplace
    `.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history)
        ? history
            .filter(
              (item) =>
                item &&
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string"
            )
            .slice(-8)
        : []),
      { role: "user", content: String(message) },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages,
      temperature: 0.3,
      max_tokens: 350,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Non sono riuscito a generare una risposta valida.";

    return res.json({ reply });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    return res.status(500).json({
      error: "Errore assistente AI",
    });
  }
});



/* =======================================================
   SUPPORT TICKETS
======================================================= */

async function getTicketWithMessages(ticketId) {
  const ticketResult = await pool.query(
    `
    SELECT *
    FROM support_tickets
    WHERE id = $1
    `,
    [ticketId]
  );

  if (!ticketResult.rows.length) {
    return null;
  }

  const messagesResult = await pool.query(
    `
    SELECT *
    FROM support_messages
    WHERE ticket_id = $1
    ORDER BY created_at ASC, id ASC
    `,
    [ticketId]
  );

  return {
    ticket: ticketResult.rows[0],
    messages: messagesResult.rows,
  };
}

/* ------------------ CUSTOMER SUPPORT ------------------ */

app.post("/api/customers/support/tickets", customerAuth, async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: "subject e message sono obbligatori" });
  }

  try {
    const customerResult = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE id = $1
      `,
      [req.customer.customerId]
    );

    if (!customerResult.rows.length) {
      return res.status(404).json({ error: "Cliente non trovato" });
    }

    const customer = customerResult.rows[0];

    const ticketResult = await pool.query(
      `
      INSERT INTO support_tickets (
        requester_type,
        requester_id,
        tenant_id,
        subject,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      ["customer", customer.id, null, subject, "open"]
    );

    const ticket = ticketResult.rows[0];

    await pool.query(
      `
      INSERT INTO support_messages (
        ticket_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1, $2, $3, $4)
      `,
      [ticket.id, "customer", customer.id, message]
    );

   const full = await getTicketWithMessages(ticket.id);

try {
  await sendAdminTicketOpenedEmail({
    requesterType: "customer",
    subject,
    ticketId: ticket.id,
  });
} catch (e) {
  console.error("EMAIL ERROR:", e);
}

res.json(full);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore creazione ticket cliente" });
  }
});

app.get("/api/customers/support/tickets", customerAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM support_tickets
      WHERE requester_type = 'customer'
        AND requester_id = $1
      ORDER BY updated_at DESC, created_at DESC
      `,
      [req.customer.customerId]
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento ticket cliente" });
  }
});

app.get("/api/customers/support/tickets/:id", customerAuth, async (req, res) => {
  const ticketId = Number(req.params.id);

  try {
    const full = await getTicketWithMessages(ticketId);

    if (!full) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    if (
      full.ticket.requester_type !== "customer" ||
      Number(full.ticket.requester_id) !== Number(req.customer.customerId)
    ) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    res.json(full);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore dettaglio ticket cliente" });
  }
});

app.post(
  "/api/customers/support/tickets/:id/messages",
  customerAuth,
  async (req, res) => {
    const ticketId = Number(req.params.id);
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message obbligatorio" });
    }

    try {
      const full = await getTicketWithMessages(ticketId);

      if (!full) {
        return res.status(404).json({ error: "Ticket non trovato" });
      }

      if (
        full.ticket.requester_type !== "customer" ||
        Number(full.ticket.requester_id) !== Number(req.customer.customerId)
      ) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      await pool.query(
        `
        INSERT INTO support_messages (
          ticket_id,
          sender_type,
          sender_id,
          message
        )
        VALUES ($1, $2, $3, $4)
        `,
        [ticketId, "customer", req.customer.customerId, message]
      );

      await pool.query(
        `
        UPDATE support_tickets
        SET
          status = 'open',
          updated_at = NOW()
        WHERE id = $1
        `,
        [ticketId]
      );

      const updated = await getTicketWithMessages(ticketId);
      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Errore invio messaggio cliente" });
    }
  }
);

app.patch(
  "/api/customers/support/tickets/:id/close",
  customerAuth,
  async (req, res) => {
    const ticketId = Number(req.params.id);

    try {
      const full = await getTicketWithMessages(ticketId);

      if (!full) {
        return res.status(404).json({ error: "Ticket non trovato" });
      }

      if (
        full.ticket.requester_type !== "customer" ||
        Number(full.ticket.requester_id) !== Number(req.customer.customerId)
      ) {
        return res.status(403).json({ error: "Non autorizzato" });
      }

      const result = await pool.query(
        `
        UPDATE support_tickets
        SET
          status = 'closed',
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [ticketId]
      );

      res.json({ ticket: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Errore chiusura ticket cliente" });
    }
  }
);

/* ------------------ VENDOR SUPPORT ------------------ */

app.post("/api/vendor/support/tickets", authMiddleware, async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: "subject e message sono obbligatori" });
  }

  try {
    const ticketResult = await pool.query(
      `
      INSERT INTO support_tickets (
        requester_type,
        requester_id,
        tenant_id,
        subject,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      ["vendor", req.user.userId, req.user.tenantId || null, subject, "open"]
    );

    const ticket = ticketResult.rows[0];

    await pool.query(
      `
      INSERT INTO support_messages (
        ticket_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1, $2, $3, $4)
      `,
      [ticket.id, "vendor", req.user.userId, message]
    );

    const full = await getTicketWithMessages(ticket.id);

try {
  await sendAdminTicketOpenedEmail({
    requesterType: "vendor",
    subject,
    ticketId: ticket.id,
  });
} catch (e) {
  console.error("EMAIL ERROR:", e);
}

res.json(full);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore creazione ticket venditore" });
  }
});

app.get("/api/vendor/support/tickets", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM support_tickets
      WHERE requester_type = 'vendor' AND requester_id = $1
      ORDER BY updated_at DESC, created_at DESC
      `,
      [req.user.userId]
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento ticket venditore" });
  }
});

app.get("/api/vendor/support/tickets/:id", authMiddleware, async (req, res) => {
  const ticketId = Number(req.params.id);

  try {
    const full = await getTicketWithMessages(ticketId);

    if (!full) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    if (
      full.ticket.requester_type !== "vendor" ||
      Number(full.ticket.requester_id) !== Number(req.user.userId)
    ) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    res.json(full);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore dettaglio ticket venditore" });
  }
});

app.patch("/api/vendor/support/tickets/:id/status", authMiddleware, async (req, res) => {
  const ticketId = Number(req.params.id);
  const { status } = req.body;

  if (!["open", "in_progress", "closed"].includes(status)) {
    return res.status(400).json({ error: "status non valido" });
  }

  try {
    const full = await getTicketWithMessages(ticketId);

    if (!full) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    if (
      full.ticket.requester_type !== "vendor" ||
      Number(full.ticket.requester_id) !== Number(req.user.userId)
    ) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    const result = await pool.query(
      `
      UPDATE support_tickets
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, ticketId]
    );

    res.json({ ticket: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento stato ticket venditore" });
  }
});

app.post("/api/vendor/support/tickets/:id/messages", authMiddleware, async (req, res) => {
  const ticketId = Number(req.params.id);
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message obbligatorio" });
  }

  try {
    const full = await getTicketWithMessages(ticketId);

    if (!full) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    if (
      full.ticket.requester_type !== "vendor" ||
      Number(full.ticket.requester_id) !== Number(req.user.userId)
    ) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    await pool.query(
      `
      INSERT INTO support_messages (
        ticket_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1, $2, $3, $4)
      `,
      [ticketId, "vendor", req.user.userId, message]
    );

    await pool.query(
      `
      UPDATE support_tickets
      SET
        status = 'open',
        updated_at = NOW()
      WHERE id = $1
      `,
      [ticketId]
    );

    const updated = await getTicketWithMessages(ticketId);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore invio messaggio venditore" });
  }
});

app.patch("/api/vendor/support/tickets/:id/close", authMiddleware, async (req, res) => {
  const ticketId = Number(req.params.id);

  try {
    const full = await getTicketWithMessages(ticketId);

    if (!full) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    if (
      full.ticket.requester_type !== "vendor" ||
      Number(full.ticket.requester_id) !== Number(req.user.userId)
    ) {
      return res.status(403).json({ error: "Non autorizzato" });
    }

    const result = await pool.query(
      `
      UPDATE support_tickets
      SET
        status = 'closed',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [ticketId]
    );

    res.json({ ticket: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore chiusura ticket venditore" });
  }
});

/* ------------------ ADMIN SUPPORT ------------------ */

app.get("/api/admin/support/tickets", adminAuth, async (req, res) => {
  const status = req.query.status ? String(req.query.status) : null;

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM support_tickets
      WHERE ($1::text IS NULL OR status = $1)
      ORDER BY updated_at DESC, created_at DESC
      `,
      [status]
    );

    res.json({ tickets: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore caricamento ticket admin" });
  }
});

app.get("/api/admin/support/tickets/:id", adminAuth, async (req, res) => {
  const ticketId = Number(req.params.id);

  try {
    const full = await getTicketWithMessages(ticketId);

    if (!full) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    res.json(full);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore dettaglio ticket admin" });
  }
});

app.post("/api/admin/support/tickets/:id/messages", adminAuth, async (req, res) => {
  const ticketId = Number(req.params.id);
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message obbligatorio" });
  }

  try {
    const full = await getTicketWithMessages(ticketId);
    let replyEmail = null;

if (full.ticket.requester_type === "customer") {
  const r = await pool.query(
    "SELECT email FROM customers WHERE id = $1",
    [full.ticket.requester_id]
  );
  replyEmail = r.rows[0]?.email;
}

if (full.ticket.requester_type === "vendor") {
  const r = await pool.query(
    "SELECT email FROM users WHERE id = $1",
    [full.ticket.requester_id]
  );
  replyEmail = r.rows[0]?.email;
}

    if (!full) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    await pool.query(
      `
      INSERT INTO support_messages (
        ticket_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1, $2, $3, $4)
      `,
      [ticketId, "admin", req.admin.userId, message]
    );

    await pool.query(
      `
      UPDATE support_tickets
      SET
        status = 'in_progress',
        updated_at = NOW()
      WHERE id = $1
      `,
      [ticketId]
    );

    const updated = await getTicketWithMessages(ticketId);

try {
  if (full.ticket.requester_type === "customer") {
    await sendCustomerTicketReplyEmail({
      to: replyEmail,
      ticketId,
      subject: full.ticket.subject,
    });
  }

  if (full.ticket.requester_type === "vendor") {
    await sendVendorTicketReplyEmail({
      to: replyEmail,
      ticketId,
      subject: full.ticket.subject,
    });
  }
} catch (e) {
  console.error("EMAIL ERROR:", e);
}

res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore risposta admin ticket" });
  }
});

app.patch("/api/admin/support/tickets/:id/status", adminAuth, async (req, res) => {
  const ticketId = Number(req.params.id);
  const { status } = req.body;

  if (!["open", "in_progress", "closed"].includes(status)) {
    return res.status(400).json({ error: "status non valido" });
  }

  try {
    const result = await pool.query(
      `
      UPDATE support_tickets
      SET
        status = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [status, ticketId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    res.json({ ticket: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento stato ticket" });
  }
});

app.delete("/api/admin/support/tickets/:id", adminAuth, async (req, res) => {
  const ticketId = Number(req.params.id);

  try {
    const result = await pool.query(
      `
      DELETE FROM support_tickets
      WHERE id = $1
      RETURNING *
      `,
      [ticketId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Ticket non trovato" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore eliminazione ticket" });
  }
});

/* =======================================================
   CUSTOMER ↔ VENDOR CHAT
======================================================= */

/* ------------------ CUSTOMER CHAT ------------------ */

app.post("/api/customers/conversations", customerAuth, async (req, res) => {
  const customerId = Number(req.customer.customerId);
  const { product_id, subject, message } = req.body;

  if (!product_id || !message) {
    return res.status(400).json({ error: "product_id e message sono obbligatori" });
  }

  try {
    const productResult = await pool.query(
      `
      SELECT id, tenant_id, title
      FROM products
      WHERE id = $1
      `,
      [product_id]
    );

    if (!productResult.rows.length) {
      return res.status(404).json({ error: "Prodotto non trovato" });
    }

    const product = productResult.rows[0];

    const vendorResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE tenant_id = $1 AND role <> 'admin'
      ORDER BY id ASC
      LIMIT 1
      `,
      [product.tenant_id]
    );

    if (!vendorResult.rows.length) {
      return res.status(404).json({ error: "Venditore non trovato" });
    }

    const vendorId = vendorResult.rows[0].id;

    const existing = await pool.query(
      `
      SELECT *
      FROM conversations
      WHERE customer_id = $1
        AND vendor_id = $2
        AND tenant_id = $3
        AND product_id = $4
      LIMIT 1
      `,
      [customerId, vendorId, product.tenant_id, product.id]
    );

    let conversation;

    if (existing.rows.length) {
      conversation = existing.rows[0];
    } else {
      const created = await pool.query(
        `
        INSERT INTO conversations (
          tenant_id,
          customer_id,
          vendor_id,
          product_id,
          subject
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [
          product.tenant_id,
          customerId,
          vendorId,
          product.id,
          subject || `Info su ${product.title}`,
        ]
      );

      conversation = created.rows[0];
    }

    await pool.query(
      `
      INSERT INTO conversation_messages (
        conversation_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1, 'customer', $2, $3)
      `,
      [conversation.id, customerId, message]
    );

    await pool.query(
      `
      UPDATE conversations
      SET updated_at = NOW()
      WHERE id = $1
      `,
      [conversation.id]
    );

    res.json({ conversation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore creazione conversazione" });
  }
});

app.get("/api/customers/conversations", customerAuth, async (req, res) => {
  const customerId = Number(req.customer.customerId);

  try {
    const result = await pool.query(
      `
      SELECT
        c.*,
        t.name AS store_name,
        t.slug AS store_slug,
        p.title AS product_title,
        (
          SELECT m.message
          FROM conversation_messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        ) AS last_message
      FROM conversations c
      LEFT JOIN tenants t ON t.id = c.tenant_id
      LEFT JOIN products p ON p.id = c.product_id
      WHERE c.customer_id = $1
      ORDER BY c.updated_at DESC
      `,
      [customerId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore lista conversazioni cliente" });
  }
});

app.get("/api/customers/conversations/:id", customerAuth, async (req, res) => {
  const customerId = Number(req.customer.customerId);
  const conversationId = Number(req.params.id);

  try {
    const conversationResult = await pool.query(
      `
      SELECT
        c.*,
        t.name AS store_name,
        t.slug AS store_slug,
        p.title AS product_title
      FROM conversations c
      LEFT JOIN tenants t ON t.id = c.tenant_id
      LEFT JOIN products p ON p.id = c.product_id
      WHERE c.id = $1 AND c.customer_id = $2
      `,
      [conversationId, customerId]
    );

    if (!conversationResult.rows.length) {
      return res.status(404).json({ error: "Conversazione non trovata" });
    }

    await pool.query(
  `
  UPDATE conversations
  SET unread_customer = 0
  WHERE id = $1
  `,
  [conversationId]
);

    const messagesResult = await pool.query(
      `
      SELECT *
      FROM conversation_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC, id ASC
      `,
      [conversationId]
    );

    res.json({
      conversation: conversationResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore dettaglio conversazione cliente" });
  }
});

app.post("/api/customers/conversations/:id/messages", customerAuth, async (req, res) => {
  const customerId = Number(req.customer.customerId);
  const conversationId = Number(req.params.id);
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message obbligatorio" });
  }

  try {
    const check = await pool.query(
      `
      SELECT id
      FROM conversations
      WHERE id = $1 AND customer_id = $2
      `,
      [conversationId, customerId]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: "Conversazione non trovata" });
    }

    await pool.query(
      `
      INSERT INTO conversation_messages (
        conversation_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1, 'customer', $2, $3)
      `,
      [conversationId, customerId, message]
    );

   await pool.query(
  `
  UPDATE conversations
  SET
    updated_at = NOW(),
    last_message_sender = 'customer',
    last_message_at = NOW(),
    unread_vendor = unread_vendor + 1,
    unread_customer = 0
  WHERE id = $1
  `,
  [conversationId]
);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore invio messaggio cliente" });
  }
});

/* ------------------ VENDOR CHAT ------------------ */

app.get("/api/vendor/conversations", authMiddleware, async (req, res) => {
  const vendorId = Number(req.user.userId);
  const tenantId = Number(req.user.tenantId);

  try {
    const result = await pool.query(
      `
      SELECT
        c.*,
        customers.name AS customer_name,
        customers.email AS customer_email,
        p.title AS product_title,
        (
          SELECT m.message
          FROM conversation_messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC, m.id DESC
          LIMIT 1
        ) AS last_message
      FROM conversations c
      LEFT JOIN customers ON customers.id = c.customer_id
      LEFT JOIN products p ON p.id = c.product_id
      WHERE c.vendor_id = $1 AND c.tenant_id = $2
      ORDER BY c.updated_at DESC
      `,
      [vendorId, tenantId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore lista conversazioni venditore" });
  }
});

app.get("/api/vendor/conversations/:id", authMiddleware, async (req, res) => {
  const vendorId = Number(req.user.userId);
  const tenantId = Number(req.user.tenantId);
  const conversationId = Number(req.params.id);

  try {
    const conversationResult = await pool.query(
      `
      SELECT
        c.*,
        customers.name AS customer_name,
        customers.email AS customer_email,
        p.title AS product_title
      FROM conversations c
      LEFT JOIN customers ON customers.id = c.customer_id
      LEFT JOIN products p ON p.id = c.product_id
      WHERE c.id = $1
        AND c.vendor_id = $2
        AND c.tenant_id = $3
      `,
      [conversationId, vendorId, tenantId]
    );

    if (!conversationResult.rows.length) {
      return res.status(404).json({ error: "Conversazione non trovata" });
    }

    await pool.query(
  `
  UPDATE conversations
  SET unread_vendor = 0
  WHERE id = $1
  `,
  [conversationId]
);

    const messagesResult = await pool.query(
      `
      SELECT *
      FROM conversation_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC, id ASC
      `,
      [conversationId]
    );

    res.json({
      conversation: conversationResult.rows[0],
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore dettaglio conversazione venditore" });
  }
});

app.post("/api/vendor/conversations/:id/messages", authMiddleware, async (req, res) => {
  const vendorId = Number(req.user.userId);
  const tenantId = Number(req.user.tenantId);
  const conversationId = Number(req.params.id);
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message obbligatorio" });
  }

  try {
    const check = await pool.query(
      `
      SELECT id
      FROM conversations
      WHERE id = $1
        AND vendor_id = $2
        AND tenant_id = $3
      `,
      [conversationId, vendorId, tenantId]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: "Conversazione non trovata" });
    }

    await pool.query(
      `
      INSERT INTO conversation_messages (
        conversation_id,
        sender_type,
        sender_id,
        message
      )
      VALUES ($1, 'vendor', $2, $3)
      `,
      [conversationId, vendorId, message]
    );

    await pool.query(
  `
  UPDATE conversations
  SET
    updated_at = NOW(),
    last_message_sender = 'vendor',
    last_message_at = NOW(),
    unread_customer = unread_customer + 1,
    unread_vendor = 0
  WHERE id = $1
  `,
  [conversationId]
);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore invio messaggio venditore" });
  }
});

app.delete("/api/customers/conversations/:id", customerAuth, async (req, res) => {
  const customerId = Number(req.customer.customerId);
  const conversationId = Number(req.params.id);

  try {
    const check = await pool.query(
      `
      SELECT id
      FROM conversations
      WHERE id = $1 AND customer_id = $2
      `,
      [conversationId, customerId]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: "Conversazione non trovata" });
    }

    await pool.query(
      `DELETE FROM conversation_messages WHERE conversation_id = $1`,
      [conversationId]
    );

    await pool.query(
      `DELETE FROM conversations WHERE id = $1`,
      [conversationId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore eliminazione chat" });
  }
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});