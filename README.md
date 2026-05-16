# Coolaroo IQ Boost
Make Coolaroo Solar Motorized Shade SmartHome Compatible

Coolaroo Solar Motorized Shades use a DC3100 433MHz remote to raise or lower the shades. This repository replicates the remote and on a Raspberry Pi and makes it accessable to Apple HomeKit.

>[!WARNING]
> This project is neither endorsed by nor associated with Coolaroo in any way. Use at your own risk.

# Dependancies

[raspicode](https://github.com/latchdevel/raspicode)</br>
[hap-nodejs](https://github.com/homebridge/HAP-NodeJS)</br>
node-fetch</br>
pm2

# Prerequisites

Obviously, you need to have Coolaroo Solar Motorized Shades installed. Additionally, you'll need:

- A Raspbery Pi 4 or higher (**NOTE:** a Raspberry Pi Zero will not work in this application.)
- A compatible 16GB SD Card
- A USB-C power adapter
- A 433MHz transmitter that is OOK compatible (there are tons on Amazon and other places)
- Wires to connect the transmitter to the GPIO port on the Raspberry Pi
- A way to read the codes from the Coolaroo remotes–I used a [Flipper Zero](https://flipperzero.one/).

## Set up Coolaroo Solar Motorized Shades

After you install the shades, you have to marry them to the remote. I found Coolaroo's instructions confusing. Here's a clearer listing of the steps:

> [!NOTE]
> - On the DC3100, you have to remove the back cover to get to the programming button. You may have to hold the battery in too.
> - The program button on the motor unit is near the antenna and is flush. I used a small screwdriver to push it.

1. Press and hold the **Motor Program Button** until the motor **rotates 4 times** and **beeps**.
2. Press and hold the **Motor Program Button** until the motor **rotates once** and **beeps**.
3. Press the **Remote Control Program Button**. The motor **rotates once** and **beeps**.
4. Press the **Remote Control Program Button** again. The motor **beeps**.
5. Press the **Remote Control Up Button**. The motor **beeps 4 times**.
6. Press the **Remote Control Program Button**. The motor **rotates once** and **beeps**.
7. Press the **Remote Control Up Button**. The motor **beeps**.
8. Press the **Remote Control Program Button**. The motor **rotates once** and **beeps 4 times**.
9. Move the blind to the desired **up position**. Press and hold the **Remote Control Stop Button**. The motor **rotates once** and **beeps 4 times**.
10. Move the blind to the desired **down position**. Press and hold the **Remote Control Stop Button**. The motor **rotates once** and **beeps 4 times**.
11. Test the set up. If it fails, simply start the process again.

## Capture the Remote Control Codes

This is the tricky bit. I recommend using a Flipper Zero. Once I understood it, it was pretty straight forward. These videos were helpful:

[https://www.youtube.com/watch?v=jNi-KlFTVkw](https://www.youtube.com/watch?v=jNi-KlFTVkw)

[https://www.youtube.com/watch?v=ojpc7Q2fjS8](https://www.youtube.com/watch?v=ojpc7Q2fjS8)

[https://www.youtube.com/watch?v=r9pXts8KhtA](https://www.youtube.com/watch?v=r9pXts8KhtA)

What you need is the serial number of the remote. You'll need to translate the hexidecimal code it records into binary. Once you do, the first three bytes (24 ones and zeros) represent the serial number. The rest of the code is standard and we'll build in the accessory.

## Connect the 433MHz Transmitter

Depending on the transmitter you bought, you may have to do some soldering. If the transmitter already has pins installed, simple female-to-female jumpers will work.

Connect the V<sub>CC</sub> to Pin 2, GND to pin 6 and DATA to pin 12.
With the ethernet port down and the SD Card at the top, the top portion of the GPIO port should look like this:

•  V<sub>CC</sub><br>
•  •<br>
•  GND<br>
•  •<br>
•  •<br>
•  DATA<br>

# What's New in version 2.0?
 
- **Command queue** — `RFQueue.js` ensures only one RF signal is sent at a time. If you trigger multiple shades simultaneously, commands are queued and executed in order with a small gap between them to prevent signal collisions.
- **Improved HomeKit state handling** — Fixes the "Closing…" spinner that would persist in the Home app after a command completed. Current position, target position, and position state are now updated in the correct sequence.
- **Automatic persistence isolation** — Each accessory automatically creates its own `persist-<name>` folder for HAP storage, derived from its `name` in the config. No manual path management needed.
- **Cleaner configuration** — All per-accessory settings are consolidated into a single `config` block at the top of `blindaccessory.js`, making it much easier to duplicate and customize for additional shades.

# Install Software
 
Image your SD Card with the latest version of Bookworm and boot your Raspberry Pi.
 
## Update the Raspberry Pi
 
`sudo apt-get -y update && sudo apt-get -y upgrade`
 
## Get Setup
 
> [!IMPORTANT]
> IT IS NOT NECESSARY to clone this repository. The setup script will get the files you need.
 
Get and run the setup file:
 
```bash
curl -O https://raw.githubusercontent.com/ahnyerkeester/coolaroo-iq-boost/main/setup.sh
chmod +x setup.sh
./setup.sh
```
 
# Configure For Your Setup
 
All the software should now be installed. You just need to localize the setup for your equipment.
You should have gotten the serial number for your remote by now. Open the accessory file to configure it:
 
`nano ~/homekit-project/blindaccessory.js`
 
Near the top you'll see a configuration block:
 
```js
const config = {
  name: "The Blind",                     // Change this for each accessory
  model: "The Blind",                    // Change this for each accessory
  serial: "NCC1701",                     // Change this for each accessory
  firmware: "2.0",
  manufacturer: "Tim Etherington",
  username: "1A:00:CC:XX:XX:XX",         // Change this for each accessory
  pincode: "031-45-159",
  port: 47129,                           // Change this for each accessory
  uuidType: "hap.blind",                 // Change this for each accessory (e.g., hap.blind2)
  stateFileName: 'the-blind-state.json', // Change this for each accessory
 
  // RF Constants
  serialNum: "XXXXXXXXXXXXXXXXXXXXXXXX",  // Change this for each accessory
  channel: "0000",
  channelConst: "0101"
};
```
 
Fill in the values marked **Change this for each accessory**:
 
- **name / model** — A friendly name for this shade (e.g., `"Blind North"`)
- **serial** — Any unique identifier you like
- **username** — A unique MAC-style address in `XX:XX:XX:XX:XX:XX` format
- **pincode** — The HomeKit pairing code (default `031-45-159`)
- **port** — A unique port number for this accessory
- **uuidType** — A unique string to generate the accessory UUID (e.g., `"hap.blind"`, `"hap.blind2"`)
- **stateFileName** — A unique filename to persist the blind's position (e.g., `"blind-north-state.json"`)
- **serialNum** — The 24-bit binary serial number you captured from your remote
Save the file and restart to load the new configuration:
 
`pm2 restart all`
 
On your iPhone, launch the Home app. Hit the **+** at the top and select **Add Accessory**.
Next, select **More options...**
 
If everything has worked, you should see:
> **Select an Accessory**  
> **to Add to My Home**
 
and your shade should be listed there.
 
The default pairing code for the accessory is **031-45-159**
 
# Adding More Shades
 
If you have more than one shade, you'll need a separate accessory file for each one. Each shade must also be paired to its own remote so you can capture a unique serial number. Start by deciding what you'll call each shade (e.g., "Blind North" and "Blind South").
 
To add a second shade:
 
```bash
cd ~/homekit-project
cp blindaccessory.js blind2.js
nano blind2.js
```
 
Edit the `config` block at the top. Every field marked **Change this for each accessory** must be unique across all your accessory files:
 
```js
const config = {
  name: "Blind South",
  model: "Blind South",
  serial: "NCC1702",
  username: "1A:00:CC:XX:XX:XY",         // Must differ from your first accessory
  pincode: "031-45-160",                  // Must differ from your first accessory
  port: 47130,                            // Must differ from your first accessory
  uuidType: "hap.blind2",                // Must differ from your first accessory
  stateFileName: 'blind-south-state.json',
 
  serialNum: "XXXXXXXXXXXXXXXXXXXXXXXX",  // This shade's binary serial number
  channel: "0000",
  channelConst: "0101"
};
```
 
Save the file, then open `ecosystem.config.js`:
 
`nano ~/homekit-project/ecosystem.config.js`
 
Duplicate the blind entry and point it at the new file:
 
```js
{
  name: 'blind2',
  script: '/home/pi/homekit-project/blind2.js',
  exec_mode: 'fork',
  instances: 1,
  watch: false,
  max_memory_restart: '150M',
  env: { NODE_ENV: 'production' },
},
```
 
Restart and both accessories will appear in the Home app:
 
`pm2 restart all`
 
> [!NOTE]
> `RFQueue.js` is a shared singleton. All your accessory files load the same instance, so RF commands from multiple shades are automatically queued and will never collide.
