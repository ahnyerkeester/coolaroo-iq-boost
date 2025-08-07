# Coolaroo IQ Boost
Make Coolaroo Solar Motorized Shade SmartHome Compatible

Coolaroo Solar Motorized Shades use a DC3100 433mHz remote to raise or lower the shades. This repository forms a bridge between the remote and the smart home by replicating the remote on a Raspberry Pi.

This project is neither endorsed by nor associated with Coolaroo in any way. Use at your own risk.

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

This is a bit tricky to do. I recommend using a Flipper Zero. Once I understood it, it was pretty straight forward. These videos were helpful:

[https://www.youtube.com/watch?v=jNi-KlFTVkw](https://www.youtube.com/watch?v=jNi-KlFTVkw)

[https://www.youtube.com/watch?v=ojpc7Q2fjS8](https://www.youtube.com/watch?v=ojpc7Q2fjS8)

[https://www.youtube.com/watch?v=r9pXts8KhtA](https://www.youtube.com/watch?v=r9pXts8KhtA)

What you need is the serial number of the remote. You'll need to translate the hexidecimal code it records into binary. Once you do, the first three bytes (24 ones and zeros) represents the serial number. We'll build the rest of the code in the apps.

## Connect the 433MHz Transmitter

Depending on the transmitter you bought, you may have to do some soldering. If the transmitter already has pins installed, simple female-to-female jumpers will work.

Connect the V+ to Pin 2, GND to pin 6 and Data to pin 12.
With the ethernet port down and the SD Card at the top, the top portion of the GPIO port should look like this:

•  V<sub>CC</sub><br>
•  •<br>
•  GND<br>
•  •<br>
•  •<br>
•  DATA<br>

# Install Software

Image your SD Card with the latest version of Bookworm including the desktop environment.

## Prep the Raspberr Pi

`sudo apt-get -y update && sudo apt-get -y upgrade`

## Get Setup

> [!IMPORTANT]
> IT IS NOT NECESSARY to clone this repository, this setup script will get the files you need. Use the setup file instead:

```
curl -O https://raw.githubusercontent.com/ahnyerkeester/coolaroo-iq-boost/main/setup.sh
chmod +x setup.sh
./setup.sh
```
# Configure For Your Setup

All the software should now be installed. We just need to personalize the setup up for your equipment.
You should have gotten the serial number for your remote by now. You need to put add it to the HomeKit accessory:

`nano ~/homekit-project/blind.js`

Near the top you'll see:

```
// Edit this and insert the serial number from your remote in binary:
const MySerialNumber = "0001000100010001000100010001"
```

Replace the default serial number with the one you read from your remote. Make sure it is 8 bytes (24 bits) long.
Save the file and restart it to load the new configuration:

`pm2 restart all`

Now go to your iPhone and launch the Home app. Hit the **+** at the top and select **Add Accessory**.
Next, select **More options...**

If everything has worked, you should see:

> **Select an Accessory**</br>
>  **to Add to My Home**</br>

and your shade should be listed there.

The default add code for the accessory is 0314-5152

# Adding More Shades

If you have more than one shade, like I do, you'll need to have a seperate accessory for each one. That will also mean you'll need to set up each blind on its own remote and get the serial numbers for each remote. You should start by deciding what you will call each blind. Mine are "blind north" and "blind south".

To add your second shade:

```
cd ~/homekit-project
cp blind.js blind2.js
nano blind2.js
```
Here you'll need to edit the serial number as above. But you'll also have to change a few other things. They're all at the top of the file:
```
// Edit this and insert the serial number from your remote in binary:
const MySerialNumber = "0001000100010001000100010001"
// Change these as needed:
const MyUserName = "1A:00:CC:19:F1:FE"
const MyPINCode ="031-45-152"
const MyAccessoryName ="Blind"
```
Change the username. This is hexidecimal and must have the colons where they are. You can use numbers from 0 to 9 and letters A to F. It doesn't have to be a dramatic change, one character will work.

For clarity sake, change the pincode. These are regular decimal nubmers.

Finally, change the accessory name.

Save the file then:

`nano ecosystem.config.js`

You'll need to duplicate this section:
```
    {
      name: 'blind-accessory',
      script: './homekit-project/blind.js',
      exec_mode: 'fork',
      instances: 1,
      watch: false,
      max_memory_restart: '150M',
      env: { NODE_ENV: 'production' },
    },
```
Change the `script: './homekit-project/blind.js',` to `blind2.js` or whatever you named the new accessory file.

Restart the accessories and they should show up in the Home app:

`pm2 restart all`
