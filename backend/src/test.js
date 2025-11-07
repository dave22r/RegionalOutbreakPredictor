export const method = "GET";
export const handler = (req, res) => {
  res.status(200).json({
    message: "Test endpoint is working",
  });
};
