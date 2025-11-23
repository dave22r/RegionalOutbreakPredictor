import { google } from "googleapis";

import { oauth2Clients, sessionStates } from "../../../app.js";

export const GET = async (req, res) => {
  const token = req.cookies.token;
  if (!token || !sessionStates[token]) return res.sendStatus(403);

  if (!sessionStates[token].publicUserInfo) {
    const oauth2Client = oauth2Clients[token];
    if (!oauth2Client) return res.sendStatus(403);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();
    sessionStates[token].userinfo = data;
    sessionStates[token].publicUserInfo = {
      email: data.email,
      name: data.name,
      given_name: data.given_name,
      family_name: data.family_name,
      picture: data.picture,
    };
  }
  res.status(200).json(sessionStates[token].publicUserInfo);
};
