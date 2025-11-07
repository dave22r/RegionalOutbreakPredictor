import { oauth2Clients, sessionStates } from "../../app.js";

export const method = "GET";
export const handler = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (token && sessionStates[token]) {
      delete oauth2Clients[token];
      delete sessionStates[token];
    }
    res.status(200).json({ message: "OK" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
