const { app, BrowserWindow, protocol, net, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "bahnreise",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
const root = app.isPackaged
  ? path.join(process.resourcesPath, "web")
  : path.resolve(__dirname, "../dist");
let mainWindow;

app.whenReady().then(() => {
  protocol.handle("bahnreise", (request) => {
    const url = new URL(request.url);
    if (url.host !== "app") return new Response("Forbidden", { status: 403 });
    const pathname = decodeURIComponent(url.pathname);
    const target = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (target !== root && !target.startsWith(root + path.sep))
      return new Response("Forbidden", { status: 403 });
    return net.fetch(pathToFileURL(target).toString());
  });
  const createWindow = () => {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 1000,
      minWidth: 760,
      minHeight: 650,
      title: "Bahnreise",
      backgroundColor: "#F6F4EE",
      autoHideMenuBar: true,
      show: !process.argv.includes("--smoke-test"),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    // Identify the desktop app to the map provider; no user/device identifiers.
    mainWindow.webContents.setUserAgent(
      mainWindow.webContents.getUserAgent() + " Bahnreise/0.5.0",
    );
    const openReference = (url) => {
      try {
        const target = new URL(url);
        // Links originate in the bundled map attribution and tourism catalog.
        if (
          target.protocol === "https:" &&
          !target.username &&
          !target.password
        )
          void shell.openExternal(target.href);
      } catch {
        /* Ignore malformed reference links. */
      }
    };
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      openReference(url);
      return { action: "deny" };
    });
    mainWindow.webContents.on("will-navigate", (event, url) => {
      if (!url.startsWith("bahnreise://app/")) {
        event.preventDefault();
        openReference(url);
      }
    });
    mainWindow.webContents.session.setPermissionRequestHandler(
      (_contents, _permission, callback) => callback(false),
    );
    mainWindow.loadURL(
      process.argv.includes("--smoke-test")
        ? "about:blank"
        : "bahnreise://app/",
    );
  };
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
