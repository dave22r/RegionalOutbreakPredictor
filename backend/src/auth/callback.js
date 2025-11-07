import url from "node:url";

import { oauth2Clients, sessionStates } from "../../app.js";

export const method = "GET";
export const handler = async (req, res) => {
  const q = url.parse(req.url, true).query;
  if (q.error) {
    console.log("Error:" + q.error);
  } else if (q.state !== req.session.state) {
    console.log("State mismatch");
  } else {
    try {
      const oauth2Client = oauth2Clients[req.session.state];
      let { tokens } = await oauth2Client.getToken(q.code);
      oauth2Client.setCredentials(tokens);
    } catch (e) {
      console.log(e);
    }
  }
  sessionStates[req.session.state] = {};
  res.cookie("token", req.session.state, { httpOnly: true });
  res.redirect(process.env.FRONTEND_URL);
};
