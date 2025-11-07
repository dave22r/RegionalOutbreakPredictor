import { sessionStates } from "../app.js";

export const devOnly = true;
export const method = "GET";
export const handler = (req, res) => {
  console.log(req.session);

  const token = req.cookies.token;
  if (token && sessionStates[token]) console.log(sessionStates[token]);

  res.status(200).json({
    message: "Test endpoint is working",
  });
};
