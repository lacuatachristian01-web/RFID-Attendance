#!/bin/bash
# RFID Attendance System Deployment Script for AWS EC2

echo "🚀 Starting RFID Attendance System Deployment"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python and tools
echo "🐍 Installing Python and dependencies..."
sudo apt install python3 python3-pip python3-venv git supervisor -y

# Create project directory
echo "📁 Setting up project directory..."
mkdir -p rfid-attendance
cd rfid-attendance

# Set up Python virtual environment
echo "🔧 Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python packages
echo "📚 Installing Python packages..."
pip install -r ../requirements.txt

# Initialize database
echo "🗄️ Initializing database..."
python3 ../init_db.py

# Create logs directory at the location Supervisor expects
sudo mkdir -p /home/ubuntu/rfid-attendance/logs
sudo chown ubuntu:ubuntu /home/ubuntu/rfid-attendance/logs

# Set up supervisor for auto-start
echo "⚙️ Setting up supervisor for auto-start..."
sudo tee /etc/supervisor/conf.d/rfid-attendance.conf > /dev/null <<EOF
[program:rfid-attendance]
directory=/home/ubuntu/rfid-attendance
command=/home/ubuntu/rfid-attendance/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
user=ubuntu
autostart=true
autorestart=true
stdout_logfile=/home/ubuntu/rfid-attendance/logs/out.log
stderr_logfile=/home/ubuntu/rfid-attendance/logs/error.log
EOF

# Start the service
echo "▶️ Starting RFID Attendance service..."
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start rfid-attendance

# Check status
echo "📊 Service status:"
sudo supervisorctl status rfid-attendance

echo "✅ Deployment complete!"
echo "🌐 Your API is available at: http://13.214.102.163:8000"
echo "📖 API documentation: http://13.214.102.163:8000/docs"

# Test the API
echo "🧪 Testing API..."
sleep 2
curl -s http://localhost:8000/ | head -5
