const { createProxyMiddleware } = require("http-proxy-middleware")

module.exports = function (app) {
  ;["/api", "/oauth/login"].map((route) =>
    app.use(
      route,
      createProxyMiddleware({
        target: "http://localhost:8090",
        changeOrigin: false,
        pathRewrite: (path, req) => route + (path == "/" ? "" : path),
      })
    )
  )
}
