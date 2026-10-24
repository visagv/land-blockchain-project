// One command starts everything: Ganache -> contract (auto-deploy if missing) -> backend -> browser.
const { spawn, spawnSync } = require("child_process");
const net = require("net");
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const kids = [];
const log = (m) => console.log("[LandChain] " + m);
const open = (port) => new Promise((r) => { const s = net.connect(port, "127.0.0.1"); s.once("connect", () => { s.destroy(); r(true); }); s.once("error", () => r(false)); });
const wait = async (port) => { for (let i = 0; i < 60; i++) { if (await open(port)) return true; await new Promise((r) => setTimeout(r, 1000)); } return false; };

async function deployed() {
  const f = path.join(ROOT, "backend", "contractInfo.json");
  if (!fs.existsSync(f)) return false;
  const { ethers } = require(path.join(ROOT, "backend", "node_modules", "ethers"));
  const p = new ethers.JsonRpcProvider("http://127.0.0.1:8545", undefined, { staticNetwork: ethers.Network.from(1337) });
  try { const c = await p.getCode(JSON.parse(fs.readFileSync(f, "utf8")).address); return !!c && c !== "0x"; } catch { return false; } finally { p.destroy(); }
}

(async () => {
  if (await open(8545)) log("Ganache already running.");
  else {
    log("Starting Ganache...");
    const out = fs.openSync(path.join(ROOT, "ganache.log"), "w");
    kids.push(spawn("ganache", ["--wallet.deterministic", "--database.dbPath", `"${path.join(ROOT, "..", "ganache-data")}"`], { shell: true, stdio: ["ignore", out, out] }));
    if (!(await wait(8545))) { log("Ganache did not start. Is it installed? (npm i -g ganache)"); return process.exit(1); }
  }
  if (await deployed()) log("Smart contract found on chain.");
  else {
    log("Deploying smart contract...");
    const r = spawnSync("npx", ["hardhat", "run", "scripts/deploy.js", "--network", "ganache"], { cwd: path.join(ROOT, "blockchain"), stdio: "inherit", shell: true });
    if (r.status !== 0) { log("Deploy failed. Run 'npm install' inside the blockchain folder."); return process.exit(1); }
  }
  if (await open(5001)) log("Backend already running on port 5001.");
  else kids.push(spawn("node", ["server.js"], { cwd: path.join(ROOT, "backend"), stdio: "inherit", shell: true }));
  await wait(5001);
  log("Ready:  http://localhost:5001   (Ctrl+C to stop everything)");
  spawn("cmd", ["/c", "start", "", "http://localhost:5001"], { stdio: "ignore" });
})();

const stop = () => { kids.forEach((k) => spawnSync("taskkill", ["/pid", k.pid, "/T", "/F"], { stdio: "ignore" })); process.exit(0); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
