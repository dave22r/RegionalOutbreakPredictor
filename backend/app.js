import fs from "node:fs";
import crypto from "node:crypto";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import { google } from "googleapis";
import { handler as outbreaksHandler } from "./src/api/outbreaks.js";

import { pathToFileURL } from "url";

const PORT = process.env.PORT || 3000;

// ============ GOOGLE AUTH SETUP ============
export const newOauth2Client = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_ID,
    process.env.GOOGLE_OAUTH_SECRET,
    `${process.env.BACKEND_URL}/auth/callback`
  );

export const oauth2Clients = {};
export const sessionStates = {};

// ============ EXPRESS SETUP ============
const app = express();
app.use(express.json());
app.use(
  session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
  })
);
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// ============ ROUTE TRAVERSAL ============
const traverse = (dir, fn) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const path = `${dir}/${file}`;
    if (fs.statSync(path).isDirectory()) {
      traverse(path, fn);
    } else {
      if (path.endsWith(".DS_Store")) return; // skip macOS junk files
      fn(path);
    }
  }
};

traverse("src", async (path) => {
  console.log("🔍 Scanning file:", path);

  try {
    
    const module = await import(pathToFileURL(`${process.cwd()}/${path}`));
    const { devOnly, method, handler } = module;

    console.log("→ method:", method, "handler exists:", !!handler);

    if (path.includes("utils")) return;
    if (devOnly && !process.argv.includes("--dev")) return;

    if (
      !method ||
      !["all", "get", "post", "put", "delete", "patch", "options", "head"].includes(
        method.toLowerCase()
      ) ||
      !handler
    ) {
      console.log("⚠️  Invalid route skipped:", path);
      return;
    }

    const route = path.split("src")[1].replace(".js", "");
    app[method.toLowerCase()](route, handler);
    console.log(`Route ${route} registered`);
  } catch (err) {
    console.error(` Error importing ${path}:`, err.message);
  }
});

// ============ STATIC API ROUTE ============
app.all("/api/outbreaks", outbreaksHandler);

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
