const { Accessory, Service, Characteristic, uuid, Categories } = require('hap-nodejs');
const fs = require('fs').promises;
const path = require('path');
// Edit this and insert the serial number from your remote in binary:
const MySerialNumber = "0001000100010001000100010001"

const stateFile = path.join(__dirname, 'blind-state.json');
let currentPosition = 100; // Default to open

// Load persisted state
async function loadState() {
  try {
    const data = await fs.readFile(stateFile, 'utf8');
    const state = JSON.parse(data);
    currentPosition = state.currentPosition || 100;
    console.log(`[${new Date().toISOString()}] Loaded state: CurrentPosition = ${currentPosition}`);
  } catch (err) {
    console.log(`[${new Date().toISOString()}] No state file found, using default CurrentPosition = 100`);
  }
}

// Save state
async function saveState() {
  try {
    await fs.writeFile(stateFile, JSON.stringify({ currentPosition }));
    console.log(`[${new Date().toISOString()}] Saved state: CurrentPosition = ${currentPosition}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to save state: ${err.message}`);
  }
}

// Load state on startup
loadState().then(() => {
  const accessory = new Accessory('North Blind', uuid.generate('hap.blind2'));

 // Set AccessoryInformation
  const accessoryInfo = accessory.getService(Service.AccessoryInformation) ||
                       accessory.addService(Service.AccessoryInformation);

  accessoryInfo
    .setCharacteristic(Characteristic.Manufacturer, 'Tim Etherington')
    .setCharacteristic(Characteristic.Model, 'North Blind')
    .setCharacteristic(Characteristic.SerialNumber, 'NCC1701B')
    .setCharacteristic(Characteristic.FirmwareRevision, '1.5');

  const blindService = accessory.addService(Service.WindowCovering, 'North Blind');

  // Blind control constants
  const rawserialnum = MySerialNumber;
  const rawchannel = "0000";
  const rawchannelconst = "0101";
  const rawup = "00010001";
  const rawdown = "00110011";
  const rawstop = "01010101";
  const zero = "366";
  const one = "733";
  const start_long = "4758";
  const start_short = "1466";
  const end_long = "7756";
  const pulsetrain_intro = "c:23";
  const pulsetrain_end = ";p:" + zero + "," + one + "," + start_long + "," + start_short + "," + end_long;

  let targetPosition = currentPosition;
  let currentPosState = Characteristic.PositionState.STOPPED;

  blindService.getCharacteristic(Characteristic.PositionState)
    .on('get', (callback) => {
      console.log(`[${new Date().toISOString()}] Queried PositionState: ${currentPosState}`);
      callback(null, currentPosState);
    });

  blindService.getCharacteristic(Characteristic.CurrentPosition)
    .on('get', (callback) => {
      console.log(`[${new Date().toISOString()}] Queried CurrentPosition: ${currentPosition}`);
      callback(null, currentPosition);
    });

  blindService.getCharacteristic(Characteristic.TargetPosition)
    .on('set', async (value, callback) => {
      console.log(`[${new Date().toISOString()}] Setting North Blind to ${value}%`);
      const endpoint = 'http://127.0.0.1:8087/picode/';
      let rawkey, lastpart, newPosition;

      if (value >= 1 && value <= 50) {
        targetPosition = 0;
        lastpart = "@";
        rawkey = rawdown;
        newPosition = 0;
      } else if (value > 50 && value <= 100) {
        targetPosition = 100;
        lastpart = "@";
        rawkey = rawup;
        newPosition = 100;
      } else {
        targetPosition = currentPosition;
        lastpart = "@";
        rawkey = rawdown;
        newPosition = currentPosition;
      }

      let toprocess = rawserialnum + rawchannel + rawchannelconst + rawkey;
      let processedstring = "";
      let toOne = "10";
      let toZero = "01";

      for (let i = 0; i < toprocess.length; i++) {
        if (i === toprocess.length - 1) {
          toOne = "14";
          toZero = "04";
        }
        processedstring += toprocess[i] === "1" ? toOne : toZero;
      }

      const url = endpoint + pulsetrain_intro + processedstring + pulsetrain_end + lastpart;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          console.log(`[${new Date().toISOString()}] Attempt ${attempts} to fetch ${url}`);
          const response = await fetch(url, { timeout: 5000, family: 4 });
          console.log(`[${new Date().toISOString()}] Response: ${response.status}`);
          if (response.status === 200 && rawkey !== rawstop) {
            currentPosition = newPosition;
            blindService.getCharacteristic(Characteristic.CurrentPosition).updateValue(currentPosition);
            await saveState();
          }
          callback(null);
          return;
        } catch (err) {
          console.error(`[${new Date().toISOString()}] Attempt ${attempts} failed: ${err.message}`);
          if (attempts < maxAttempts) {
            console.log(`[${new Date().toISOString()}] Retrying in 1s`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.error(`[${new Date().toISOString()}] All attempts failed`);
            callback(err);
          }
        }
      }
    });

  accessory.publish({
    username: "1A:00:CC:19:01:FE",
    pincode: "031-45-159",
    port: 47130,
    category: Categories.WINDOW_COVERING,
  });

  console.log(`[${new Date().toISOString()}] Blind Accessory Version: 1.0, PIN: 031-45-159`);
});
