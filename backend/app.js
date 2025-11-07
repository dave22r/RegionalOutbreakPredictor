import fs from "node:fs";
import express from "express";

const PORT = process.env.PORT || 3000;

const app = express();

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
  const { method, handler } = await import(`./${path}`);
  if (!method || !["all", "get", "post", "put", "delete", "patch", "options", "head"].includes(method.toLowerCase()) || !handler) {
    return console.log("Invalid route", path);
  }
  app[method.toLowerCase()](route, handler);
  console.log(`Route ${route} registered`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
