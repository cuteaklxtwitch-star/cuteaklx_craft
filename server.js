#!/usr/bin/env node
/*
 * Production server for Render (and any Docker host).
 *
 * One process, one port:
 *   - serves the built web client from ./dist
 *   - runs the WebSocket -> TCP Minecraft proxy under /api/vm/net (mwc-proxy),
 *     including the Microsoft account login endpoints needed for online-mode servers
 *   - serves the mods repository from ./mods (add it in-game as <your-url>/mods)
 *
 * Env vars:
 *   PORT                    port to listen on (Render sets this automatically)
 *   MAX_CONNECTIONS_PER_IP  proxy connection cap per client IP (default 5)
 *   LOG=true                print proxy access log to stdout
 */
const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')
const cors = require('cors')
const { createProxyMiddleware } = require('mwc-proxy')

const root = __dirname
const distDir = path.join(root, 'dist')
const publicDir = path.join(root, 'public')
const modsDir = path.join(root, 'mods')
const port = Number(process.env.PORT) || 8080

const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

const app = express()
app.use(compression())
app.use(cors())

// Minecraft proxy + Microsoft auth. Must be mounted before app.listen():
// the middleware takes over listen() so WebSocket upgrades reach it.
app.use(createProxyMiddleware({
  urlRoot: '/api/vm/net',
  allowOrigin: '*',
  allowOriginApp: true,
  maxConnectionsPerIp: Number(process.env.MAX_CONNECTIONS_PER_IP) || 5,
  log: process.env.LOG === 'true',
  metricsEndpoint: false,
  debugUrlEndpoint: false,
}))

// Runtime config for the client: bundled config, then optional public/config.json
// overrides. defaultProxy '' = "use the origin this page was served from".
app.get('/config.json', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({
    ...readJson(path.join(distDir, 'config.json')),
    defaultProxy: '',
    ...readJson(path.join(publicDir, 'config.json')),
  })
})

// Mods repository: /mods/mcraft-repo.json + one folder per mod
app.use('/mods', express.static(modsDir, {
  setHeaders: (res) => res.set('Cache-Control', 'no-cache'),
}))

// Cross-origin isolation is required for SharedArrayBuffer (mesher workers);
// wasm needs the right MIME type for streaming compilation.
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  if (req.path.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm')
  next()
})

app.use(express.static(publicDir))
app.use(express.static(distDir))

app.listen(port, () => {
  console.log(`Web client + Minecraft proxy listening on port ${port}`)
})
