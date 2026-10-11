const { app, BrowserWindow, Menu, shell, ipcMain, screen, nativeImage, nativeTheme } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

// Keep the original data folder so profiles made before the rename survive.
app.setAppUserModelId('com.local.matrix');
app.setPath('userData', path.join(app.getPath('appData'), 'Ledger'));

const MIN_W = 760, MIN_H = 560, DEF_W = 1180, DEF_H = 780;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let win;

  // Forces the window back to a usable size/position whenever it is too small
  // or ends up off-screen.
  function fit(w) {
    if (!w || w.isDestroyed() || w.isMaximized() || w.isMinimized() || w.isFullScreen()) return;
    const b = w.getBounds();
    const visible = screen.getAllDisplays().some(d => {
      const a = d.workArea;
      return b.x < a.x + a.width - 80 && b.x + b.width > a.x + 80 && b.y < a.y + a.height - 40 && b.y + b.height > a.y;
    });
    if (b.width >= MIN_W && b.height >= MIN_H && visible) return;
    const wa = screen.getDisplayMatching(visible ? b : screen.getPrimaryDisplay().bounds).workArea;
    const W = Math.min(DEF_W, wa.width), H = Math.min(DEF_H, wa.height);
    w.setBounds({
      x: wa.x + Math.round((wa.width - W) / 2),
      y: wa.y + Math.round((wa.height - H) / 2),
      width: W, height: H
    });
  }

  // Taskbar icon follows the Windows taskbar theme: white M on a dark taskbar,
  // black M on a light one.
  const fs = require('fs');
  let iconDark = null;
  const note = m => { try { fs.appendFileSync(path.join(app.getPath('userData'), 'icon-debug.txt'), new Date().toISOString() + ' ' + m + '\n'); } catch (_) {} };
  function loadIcon(dark) {
    const n = dark ? 'white' : 'black';
    let img = nativeImage.createFromPath(path.join(__dirname, `icon-${n}.ico`));
    if (img.isEmpty()) img = nativeImage.createFromPath(path.join(__dirname, `icon-${n}.png`));
    if (img.isEmpty()) { try { img = nativeImage.createFromBuffer(fs.readFileSync(path.join(__dirname, `icon-${n}.png`))); } catch (_) {} }
    return img;
  }
  function applyIcon(dark, force) {
    if (!win || win.isDestroyed()) return;
    if (dark === iconDark && !force) return;
    iconDark = dark;
    try {
      const img = loadIcon(dark);
      win.setIcon(img);
      note('dark=' + dark + ' empty=' + img.isEmpty());
    } catch (e) { note('setIcon failed: ' + e.message); }
  }
  function checkTaskbarTheme(force) {
    if (process.platform !== 'win32') return applyIcon(nativeTheme.shouldUseDarkColors, force);
    const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize';
    const reg = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe');
    execFile(reg, ['query', key], { windowsHide: true }, (err, out) => {
      if (err) { note('reg failed: ' + err.message); return applyIcon(nativeTheme.shouldUseDarkColors, force); }
      const get = n => { const m = new RegExp(n + '\\s+REG_DWORD\\s+0x([0-9a-fA-F]+)').exec(out || ''); return m ? parseInt(m[1], 16) : null; };
      const sys = get('SystemUsesLightTheme'), apps = get('AppsUseLightTheme');
      const light = sys !== null ? sys : apps;
      applyIcon(light === null ? nativeTheme.shouldUseDarkColors : light === 0, force);
    });
  }

  function createWindow() {
    const wa = screen.getPrimaryDisplay().workArea;
    win = new BrowserWindow({
      width: Math.min(DEF_W, wa.width), height: Math.min(DEF_H, wa.height),
      minWidth: MIN_W, minHeight: MIN_H,
      titleBarStyle: 'hidden',
      titleBarOverlay: { color: '#111113', symbolColor: '#f4f4f5', height: 45 },
      show: false,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      icon: path.join(__dirname, 'icon-white.ico'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true, nodeIntegration: false, sandbox: true
      }
    });
    const w = win;
    checkTaskbarTheme(true);
    ['ready-to-show', 'show', 'focus'].forEach(ev => w.on(ev, () => checkTaskbarTheme(true)));
    const themeTimer = setInterval(checkTaskbarTheme, 3000);
    nativeTheme.on('updated', checkTaskbarTheme);
    w.on('closed', () => clearInterval(themeTimer));
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'editMenu' }, { role: 'viewMenu' }]));
    w.loadFile('index.html');
    w.once('ready-to-show', () => { fit(w); w.show(); });
    let t = null;
    const later = () => { clearTimeout(t); t = setTimeout(() => fit(w), 200); };
    ['resize', 'move', 'restore', 'unmaximize', 'show'].forEach(ev => w.on(ev, later));
    w.webContents.on('did-finish-load', later);
    w.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
    w.webContents.on('will-navigate', e => e.preventDefault());
  }

  // Restart (used when the language changes): reload the page inside the same
  // window, so the window itself is never recreated or resized.
  ipcMain.handle('app:restart', () => {
    if (win && !win.isDestroyed()) win.webContents.reloadIgnoringCache();
  });

  // Keep the native window buttons in step with the app theme.
  ipcMain.handle('win:overlay', (_e, mode) => {
    const dark = mode === 'dark';
    try {
      if (win && !win.isDestroyed() && win.setTitleBarOverlay)
        win.setTitleBarOverlay({ color: dark ? '#111113' : '#ffffff', symbolColor: dark ? '#f4f4f5' : '#111114', height: 45 });
    } catch (_) {}
  });

  app.on('second-instance', () => {
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); fit(win); }
  });
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
