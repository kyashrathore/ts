const express = require("express");
const next = require("next");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;

const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const server = express();
  server.get("*", handleRequest);
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`Listening on http://localhost:${port}`);
  });
});

function resolveRoutes(hostname, pathname) {
  return pathname === "/" ? `/${hostname}` : `/${hostname}${pathname}`;
}

function handleRequest(req, res) {
  const myURL = new URL(req.url);

  const { pathname = "/", query, hostname } = myURL;
  const subdomains = hostname.split(".");
  let userHost = subdomains[0];

  if (subdomains.length === 2) userHost = "app";

  if (pathname?.startsWith("/_next")) {
    nextHandler(req, res);
    return;
  }

  if (pathname?.startsWith("/api/")) {
    try {
      const APIPath = pathname.replace(/^\/api\//, "");
      const { default: APIhandler } = require(path.join(
        process.cwd(),
        `pages/${userHost}/api/${APIPath}`
      ));
      APIhandler(req, res);
    } catch (_) {
      handle(req, res);
    }
    return;
  }

  const route = resolveRoutes(userHost, String(pathname));
  if (route) {
    req.tenant = userHost;
    nextApp.render(req, res, route, query);
    return;
  }
  nextHandler(req, res, parsedUrl);
}
