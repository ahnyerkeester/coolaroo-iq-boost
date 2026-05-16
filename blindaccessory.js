// Version 2.2 5/15/2026
//
// Uses centralized config for easy duplication
// Uses a queue so the signals don't step on each other
// Automatically generates unique persistence directories
// FIXED: HomeKit "Closing..." ghosting and icon state resolution
//

const { Accessory, Service, Characteristic, uuid, Categories } = require('hap-nodejs');
const fs = require('fs').promises;
const path = require('path');
const RFQueue = require('./RFQueue');

// ================== CONFIGURATION SECTION ==================
const config = {
  name: "The Blind",                     // Change this for each accessory
  model: "The Blind",                    // Change this for each accessory
  serial: "NCC1701",                     // Change this for each accessory
  firmware: "2.0",
  manufacturer: "Tim Etherington",
  username: "1A:00:CC:XX:XX:XX",         // Change this for each accessory
  pincode: "031-45-159",
  port: 47129,                           // Change this for each accessory
  uuidType: "hap.blind",                 // Change this for each accessory (e.g., hap.blind3)
  stateFileName: 'the-blind-state.json', // Change this for each accessory

  // RF Constants
  serialNum: "XXXXXXXXXXXXXXXXXXXXXXXX",  // Change this for each accessory
  channel: "0000",
  channelConst: "0101"
};
// ==========================================================

// ================== AUTOMATIC STORAGE SETUP ==================
const folderName = 'persist-' + config.name.replace(/\s+/g, '-').toLowerCase();
const storagePath = path.join(__dirname, folderName);
HAPStorage.setCustomStoragePath(storagePath);
// ==========================================================

const stateFile = path.join(__dirname, config.stateFileName);
let currentPosition = 100;

async function loadState() {
  try {
    const data = await fs.readFile(stateFile, 'utf8');
    const state = JSON.parse(data);
    currentPosition = state.currentPosition || 100;
    console.log(`[${config.name}] Loaded state: ${currentPosition}%`);
  } catch (err) {
    console.log(`[${config.name}] No state file found, using default 100%.`);
  }
}

async function saveState() {
  try {
    await fs.writeFile(stateFile, JSON.stringify({ currentPosition }));
  } catch (err) {
    console.error(`[${config.name}] Failed to save state: ${err.message}`);
  }
}

loadState().then(() => {
  const accessory = new Accessory(config.name, uuid.generate(config.uuidType));

  const accessoryInfo = accessory.getService(Service.AccessoryInformation) ||
                       accessory.addService(Service.AccessoryInformation);

  accessoryInfo
    .setCharacteristic(Characteristic.Manufacturer, config.manufacturer)
    .setCharacteristic(Characteristic.Model, config.model)
    .setCharacteristic(Characteristic.SerialNumber, config.serial)
    .setCharacteristic(Characteristic.FirmwareRevision, config.firmware);

  const blindService = accessory.addService(Service.WindowCovering, config.name);

  // RF Protocol Building Blocks
  const rawup = "00010001", rawdown = "00110011", rawstop = "01010101";
  const zero = "366", one = "733", start_long = "4758", start_short = "1466", end_long = "7756";
  const pulsetrain_intro = "c:23";
  const pulsetrain_end = `;p:${zero},${one},${start_long},${start_short},${end_long}`;

  let currentPosState = Characteristic.PositionState.STOPPED;

  blindService.getCharacteristic(Characteristic.PositionState)
    .on('get', (callback) => callback(null, currentPosState));

  blindService.getCharacteristic(Characteristic.CurrentPosition)
    .on('get', (callback) => callback(null, currentPosition));

  blindService.getCharacteristic(Characteristic.TargetPosition)
    .on('set', (value, callback) => {
      console.log(`[${config.name}] Request: Move to ${value}%`);

      const endpoint = 'http://127.0.0.1:8087/picode/';
      let rawkey, newPosition;

      // Logic: 0 is closed, 100 is open
      if (value >= 0 && value <= 50) {
        rawkey = rawdown;
        newPosition = 0;
      } else {
        rawkey = rawup;
        newPosition = 100;
      }

      let toprocess = config.serialNum + config.channel + config.channelConst + rawkey;
      let processedstring = "";
      for (let i = 0; i < toprocess.length; i++) {
        let toOne = (i === toprocess.length - 1) ? "14" : "10";
        let toZero = (i === toprocess.length - 1) ? "04" : "01";
        processedstring += (toprocess[i] === "1") ? toOne : toZero;
      }

      const url = `${endpoint}${pulsetrain_intro}${processedstring}${pulsetrain_end}@`;

      // Set moving state
      currentPosState = (newPosition > currentPosition)
                        ? Characteristic.PositionState.INCREASING
                        : Characteristic.PositionState.DECREASING;

      blindService.getCharacteristic(Characteristic.PositionState).updateValue(currentPosState);

      RFQueue.add(url, 250).then(async (success) => {
        if (success) {
          currentPosition = newPosition;

          // 1. Sync Current and Target positions to stop the spinner
          blindService.getCharacteristic(Characteristic.CurrentPosition).updateValue(currentPosition);
          blindService.getCharacteristic(Characteristic.TargetPosition).updateValue(currentPosition);

          // 2. Short delay before setting STOPPED to ensure HomeKit processes the position first
          setTimeout(() => {
            currentPosState = Characteristic.PositionState.STOPPED;
            blindService.getCharacteristic(Characteristic.PositionState).updateValue(currentPosState);
            console.log(`[${config.name}] Final State: ${currentPosition}% (STOPPED)`);
          }, 100);

          await saveState();
        }
      });

      callback(null);
    });

  accessory.publish({
    username: config.username,
    pincode: config.pincode,
    port: config.port,
    category: Categories.WINDOW_COVERING,
  });

  console.log(`[${config.name}] Online. Port: ${config.port} | Path: ${folderName}`);
});

