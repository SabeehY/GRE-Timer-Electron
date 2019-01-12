const electron = require('electron')
const moment = require('moment')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Prevent stopping on sleep
const { powerSaveBlocker } = electron
const blockerId = powerSaveBlocker.start('prevent-app-suspension')

let argsCmd = process.argv.slice(2);
let startTime = parseInt(argsCmd[0]) * 60 || (20 * 60);

function secondsToMinutes (s) {
  return (s / 60)
}
function secondsToTime(s) {
  let momentTime = moment.duration(s, 'seconds');
  let sec = momentTime.seconds() < 10 ? ('0' + momentTime.seconds()) : momentTime.seconds();
  let min = momentTime.minutes() < 10 ? ('0' + momentTime.minutes()) : momentTime.minutes();
  return `${min}:${sec}`;
}

const path = require('path')
const url = require('url')

const iconImage = electron.nativeImage.createFromPath(path.join(__dirname, '/assets/simple-timer.png'))
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 300,
    // frame: false,
    resizable: false
  });

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  
  // When UI has finish loading
  mainWindow.webContents.on('did-finish-load', () => {
    // Send the initial timer value
    mainWindow.webContents.send('timer-change', secondsToTime(startTime));
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// Helper function, to format the time
const {
  Tray,
  ipcMain,
  Notification
} = electron

let timer
let tray
let notification

function createTrayIcon() {
  tray = tray || new Tray(iconImage.resize({ width: 15 }))

  tray.on('click', () => {
    if (!mainWindow) createWindow()
    mainWindow.show()
  })
}

let initialTime
function setTimer(time) {
  // Clear if present before
  clearInterval(timer);
  initialTime = (parseFloat(time) * 60 || startTime) // seconds
  let currentTime = initialTime
  let formattedTime

  // Set initial values
  showNotification(currentTime)
  updateDisplay(currentTime)

  // Execute every second
  timer = setInterval(() => {
    // Remove one second
    currentTime = currentTime - 1;
    // Update values in tray and window
    updateDisplay(currentTime)
    // Show notification
    showNotification(currentTime)
    // When reaching 0. Stop.
    if (currentTime <= 0) clearInterval(timer)

  }, 1000); // 1 second
}


function updateDisplay (time) {
  const formattedTime  = secondsToTime(time)
  if (mainWindow) {
    mainWindow.webContents.send('timer-change', formattedTime)
  }
  if (tray) {
    tray.setTitle(formattedTime)
  }
}

function showNotification(currentTime) {
  const minutes = secondsToMinutes(currentTime)
  const initial = secondsToMinutes(initialTime)

  let show = false
  if (minutes === 0) show = true
  if (minutes === 1) show = true
  if (minutes === 5) show = true
  if (minutes === 10) show = true
  if (minutes === 15) show = true
  if (minutes === 20) show = true

  if (show || (minutes === initial)) {
    let options = {
      silent: true
    }
    if (minutes === initial) {
      options.title = 'Timer started!'
      options.body  = secondsToTime(initialTime)
    } else if (minutes) {
      options.title = `${minutes} minute${minutes !== 1 ? 's' : ''} left`
    } else {
      options.title = 'Times up!'
      options.body  = `Timer duration: ${secondsToTime(initialTime)}`
    }
    notification = new Notification(options)
    notification.show()
  }
}

ipcMain.on('reset-timer', setTimer)
ipcMain.on('set-timer', (ev, t) => setTimer(t))

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
  createTrayIcon()
  // setTimer()
})
