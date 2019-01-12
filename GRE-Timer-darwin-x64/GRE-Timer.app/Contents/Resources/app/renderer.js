// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const {
  ipcRenderer
} = require('electron')

const timerDiv = document.getElementById('timerDiv')
const timerInput = document.getElementById('set-time')
const startButton = document.getElementById('reset')

startButton && startButton.addEventListener('click', handleStart)
// timerInput && timerInput.addEventListener('change', handleSetTime)

function handleStart() {
  ipcRenderer.send('set-timer', timerInput.value)
}

ipcRenderer.on('timer-change', (event, t) => {
  timerDiv.innerHTML = t
})
