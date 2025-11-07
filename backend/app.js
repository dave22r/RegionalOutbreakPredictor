import fs from "node:fs";
import crypto from "node:crypto";

import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

import { google } from "googleapis";

const PORT = process.env.PORT || 3000;

export const newOauth2Client = () =>
  new google.auth.OAuth2(process.env.GOOGLE_OAUTH_ID, process.env.GOOGLE_OAUTH_SECRET, `${process.env.BACKEND_URL}/auth/callback`);
export const oauth2Clients = {};

export const sessionStates = {};

const app = express();
app.use(
  session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
  })
);
app.use(cookieParser());

const traverse = (dir, fn) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const path = `${dir}/${file}`;
    if (fs.statSync(path).isDirectory()) {
      traverse(path, fn);
    } else {
      fn(path);
    }
  }
};

traverse("src", async (path) => {
  const route = path.split("src")[1].replace(".js", "");
  const { devOnly, method, handler } = await import(`./${path}`);
  if (devOnly && !process.argv.includes("--dev")) return;
  if (!method || !["all", "get", "post", "put", "delete", "patch", "options", "head"].includes(method.toLowerCase()) || !handler) {
    return console.log("Invalid route", path);
  }
  app[method.toLowerCase()](route, handler);
  console.log(`Route ${route} registered`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
