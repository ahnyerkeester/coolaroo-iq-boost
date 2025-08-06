#!/bin/bash
set -e

# 1. Create WiFi Power Save Off systemd service
SERVICE_FILE="/etc/systemd/system/wifi-powersave-off.service"
if [ ! -f "$SERVICE_FILE" ]; then
  echo "Creating wifi-powersave-off systemd service..."
  sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Disable WiFi Power Save
After=network.target

[Service]
Type=oneshot
ExecStart=/sbin/iw dev wlan0 set power_save off
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
EOF
  sudo systemctl daemon-reload
  sudo systemctl enable wifi-powersave-off.service
  sudo systemctl start wifi-powersave-off.service
  echo "WiFi power save disabled and service enabled."
else
  echo "wifi-powersave-off service already exists."
fi

# 2. Prompt to set CPU isolation manually
echo
echo "************************************************"
echo "Manual step required:"
echo "Open another terminal window and ssh into this device."
echo "In that other terminal window:"
echo "sudo nano /boot/firmware/cmdline.txt"
echo "Add the following to the end of the single line in that file."
echo "    isolcpus=3"
echo "************************************************"
read -p "Press Enter to continue after you have finished editing..."

# 3. Clone and install raspicode software
if [ ! -d raspicode ]; then
  git clone https://github.com/latchdevel/raspicode.git
fi
cd raspicode/wiringpiook
python3 setup.py develop --user
cd ~

# 4. Install npm and Node.js packages
echo
echo "Installing npm and Node.js packages..."
sudo apt-get update
sudo apt-get install -y npm
sudo npm i hap-nodejs
sudo npm install -g pm2@latest

# 5. Setup homekit-project and install node-fetch
mkdir -p ~/homekit-project
cd ~/homekit-project
sudo npm install node-fetch

# 6. Install files from Github
cd /home/pi
git clone https://github.com/ahnyerkeester/coolaroo-iq-boost.git temp-repo
cp temp-repo/ecosystem.config.js homekit-project/
cp temp-repo/blind.js homekit-project/
rm -rf temp-repo

# 7. Configure to launch on reboot

pm2 start /home/pi/homekit-project/ecosystem.config.js
pm2 save
# Generate the startup command
PM2_CMD=$(pm2 startup systemd -u pi --hp /home/pi | grep "sudo" | tail -1)
# Execute the startup command
eval $PM2_CMD

echo
echo "Setup complete! Please reboot and verify with:"
echo "  iw dev wlan0 get power_save"
echo "  cat /sys/devices/system/cpu/isolated"
echo "The last command should return '3' if CPU isolation is set."
echo "Also after reboot, you can check that the accessories are running with:"
echo "  pm2 list"
