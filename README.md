# Coolaroo IQ Boost
Make Coolaroo Solar Motorized Shade SmartHome Compatible

Coolaroo Solar Motorized Shades use a DC3100 433mHz remote to raise or lower the shades. This repository forms a bridge between the remote and the smart home by replicating the remote on a Raspberry Pi.

This project is neither endorsed by nor associated with Coolaroo in any way. Use at your own risk.

# Prerequisites

Obviously, you need to have Coolaroo Solar Motorized Shades installed. Additionally, you'll need:

- A Raspbery Pi 4 or higher
- A compatible 16GB SD Card
- A USB-C power adapter
- A 433MHz transmitter that is OOK compatible (there are tons on Amazon and other places)
- Wires to connect the transmitter to the GPIO port on the Raspberry Pi
- A way to read the codes from the Coolaroo remotes–I used a [Flipper Zero](https://flipperzero.one/).

## Set up Coolaroo Solar Motorized Shades

After you install the shades, you have to marry them to the remote. I found Coolaroo's instructions confusing. Here's a summary of the steps:

**NOTES** 
On the DC3100, you have to remove the back cover to get to the programming button. You may have to hold the battery in too.
The program button on the motor unit is near the antenna and is flush. I used a small screwdriver to push it.

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

•  V+<br>
•  •<br>
•  GND<br>
•  •<br>
•  •<br>
•  Data<br>

# Set Up Software

Image your SD Card with the latest version of Bookworm including the desktop environment.

## Prep the Raspberr Pi

`sudo apt-get -y update && sudo apt-get -y upgrade`

## Disable wlan0 power save mode

`sudo nano /etc/systemd/system/wifi-powersave-off.service`

## Paste the following
```
[Unit]
Description=Disable WiFi Power Save
After=network.target

[Service]
Type=oneshot
ExecStart=/sbin/iw dev wlan0 set power_save off
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
```
## Enable the service

`sudo systemctl enable wifi-powersave-off.service`

## Isolate one CPU core

`sudo nano /boot/firmware/cmdline.txt`

## Add this to the end of the one line of text:

`isolcpus=3`

## Reboot and verify:

`sudo reboot`
```
iw dev wlan0 get power_save
cat /sys/devices/system/cpu/isolated
```
Should say power save is off and return the number 3.

`sudo raspi-config`

Under Interface Options, enable VNC.

## Install raspicode
This will control the transmitter
```
git clone https://github.com/latchdevel/raspicode.git
cd raspicode/wiringpiook
python3 setup.py develop --user
```

## Install hap-nodejs
This is how we will connect to HomeKit

```
cd ~
sudo apt-get install -y npm
sudo npm i hap-nodejs
sudo npm install -g pm2@latest
```

# Set Up Shady App

```
cd ~
mkdir homekit-project
cd /home/pi/homekit-project
sudo npm install node-fetch
```

## On host computer:


## Manually start them

pm2 start homekit-project/ecosystem.config.js

## Optional:
pm2 list

pm2 logs
## Should show no errors

ctrl-c

## To start them on boot:

pm2 save
pm2 startup

## This will give you a sudo env command to run. Copy and paste
##  Mine looked like this:

sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi

## Reboot and we'll make sure it is working
## after reboot, run

pm2 list


#Add to HomeKit

Code 031-45-159 blind
Code 031-45-160 sblind
