import fs from "node:fs";
import crypto from "node:crypto";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import { google } from "googleapis";

import { pathToFileURL } from "url";

const PORT = process.env.PORT || 3000;
const FS_BASE_PATH = "src/api";

// ============ GOOGLE AUTH SETUP ============
export const newOauth2Client = () =>
  new google.auth.OAuth2(process.env.GOOGLE_OAUTH_ID, process.env.GOOGLE_OAUTH_SECRET, `${process.env.BACKEND_URL}/auth/callback`);

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
      if (!path.endsWith(".js")) continue; // Skip non-.js files
      fn(path);
    }
  }
};

traverse(FS_BASE_PATH, async (path) => {
  console.log("🔍 Scanning file:", path);

  let registeredMethods = [];
  try {
    const module = await import(pathToFileURL(`${process.cwd()}/${path}`));
    const { devOnly, ...methods } = module;

    if (devOnly && !process.argv.includes("--dev")) return;
    const route = path.split(FS_BASE_PATH)[1].replace(".js", "");
    for (const [method, handler] of Object.entries(methods)) {
      if (!method || !["all", "get", "post", "put", "delete", "patch", "options", "head"].includes(method.toLowerCase()) || !handler) {
        console.log("Warning: Invalid method", method, "skipped in", path);
        return;
      }
      app[method.toLowerCase()](route, handler);
      registeredMethods.push(method);
    }
    console.log(`Route ${route} registered:`, registeredMethods.join(", "));
  } catch (err) {
    console.error(` Error importing ${path}:`, err.message);
  }
});

// ============ START SERVER ============
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
