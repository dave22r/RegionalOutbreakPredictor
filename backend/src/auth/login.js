import crypto from "node:crypto";

import { newOauth2Client, oauth2Clients } from "../../app.js";

const scopes = ["userinfo.email", "userinfo.profile"].map((s) => `https://www.googleapis.com/auth/${s}`);

export const method = "get";
export const handler = (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");
  req.session.state = state;
  oauth2Clients[state] = newOauth2Client();
  const url = oauth2Clients[state].generateAuthUrl({
    scope: scopes,
    state: state,
    redirect_uri: `${process.env.BACKEND_URL}/auth/callback`,
  });
  res.redirect(url);
};
