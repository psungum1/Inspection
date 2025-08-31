#!/bin/bash

# Ubuntu Desktop 24 Setup Script for Inspection System
# This script installs all required dependencies and prepares the system

set -e  # Exit on any error

echo "🖥️  Setting up Ubuntu Desktop 24 for Inspection System..."
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Function to check if package is installed
is_package_installed() {
    dpkg -l "$1" &> /dev/null
}

# Function to install package if not already installed
install_package() {
    local package=$1
    local description=${2:-$1}
    
    if is_package_installed "$package"; then
        print_status "$description is already installed ✓"
    else
        print_status "Installing $description..."
        sudo apt install -y "$package"
        print_success "$description installed successfully"
    fi
}

# Update system packages
print_status "Updating system packages..."
sudo apt update
print_success "System packages updated"

# Install essential packages
print_status "Installing essential packages..."
install_package "curl" "cURL"
install_package "wget" "Wget"
install_package "build-essential" "Build Essential"
install_package "git" "Git"
install_package "unzip" "Unzip"
install_package "software-properties-common" "Software Properties Common"

# Install Node.js 18.x LTS
print_status "Setting up Node.js 18.x LTS repository..."
if ! command -v node &> /dev/null; then
    print_status "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    print_status "Installing Node.js..."
    sudo apt-get install -y nodejs
    print_success "Node.js installed successfully"
else
    NODE_VERSION=$(node --version)
    print_status "Node.js is already installed: $NODE_VERSION"
fi

# Install npm if not present
if ! command -v npm &> /dev/null; then
    print_status "Installing npm..."
    sudo apt install -y npm
    print_success "npm installed successfully"
else
    NPM_VERSION=$(npm --version)
    print_status "npm is already installed: $NPM_VERSION"
fi

# Install PostgreSQL
print_status "Installing PostgreSQL..."
install_package "postgresql" "PostgreSQL"
install_package "postgresql-contrib" "PostgreSQL Contrib"

# Start and enable PostgreSQL service
print_status "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql
print_success "PostgreSQL service started and enabled"

# Create database and user
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE pqms_db;" 2>/dev/null || print_warning "Database pqms_db already exists"
sudo -u postgres psql -c "CREATE USER pqms_a WITH PASSWORD 'Kumair00P@ssw0rd';" 2>/dev/null || print_warning "User pqms_a already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE pqms_db TO pqms_a;" 2>/dev/null || print_warning "Privileges already granted"
sudo -u postgres psql -c "ALTER USER pqms_a CREATEDB;" 2>/dev/null || print_warning "User already has CREATEDB privilege"
print_success "PostgreSQL database setup completed"

# Install Nginx
print_status "Installing Nginx..."
install_package "nginx" "Nginx"

# Start and enable Nginx service
print_status "Starting Nginx service..."
sudo systemctl start nginx
sudo systemctl enable nginx
print_success "Nginx service started and enabled"

# Install PM2 globally
print_status "Installing PM2 Process Manager..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed successfully"
else
    PM2_VERSION=$(pm2 --version)
    print_status "PM2 is already installed: $PM2_VERSION"
fi

# Install additional useful packages
print_status "Installing additional useful packages..."
install_package "htop" "htop (system monitor)"
install_package "tree" "Tree (directory listing)"
install_package "vim" "Vim (text editor)"
install_package "net-tools" "Net Tools"
install_package "ufw" "Uncomplicated Firewall"

# Configure firewall
print_status "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
print_success "Firewall configured"

# Create project directory
PROJECT_DIR="/var/www/inspection"
print_status "Creating project directory: $PROJECT_DIR"
sudo mkdir -p "$PROJECT_DIR"
sudo chown $USER:$USER "$PROJECT_DIR"
print_success "Project directory created"

# Create PM2 log directory
print_status "Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
print_success "PM2 log directory created"

# Set up PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup
print_success "PM2 startup script configured"

# Display system information
echo ""
echo "=========================================================="
print_success "Ubuntu Desktop 24 setup completed successfully! 🎉"
echo "=========================================================="
echo ""
echo "📋 Installed Components:"
echo "   • Node.js 18.x LTS"
echo "   • npm"
echo "   • PostgreSQL 15+"
echo "   • Nginx"
echo "   • PM2 Process Manager"
echo "   • Essential system packages"
echo ""
echo "🔧 Services Status:"
echo "   • PostgreSQL: $(sudo systemctl is-active postgresql)"
echo "   • Nginx: $(sudo systemctl is-active nginx)"
echo "   • Firewall: $(sudo ufw status | grep Status | cut -d' ' -f2)"
echo ""
echo "📁 Project Directory: $PROJECT_DIR"
echo "🗄️  Database: pqms_db (user: pqms_a)"
echo "🌐 Web Server: Nginx (port 80)"
echo "⚡ Process Manager: PM2"
echo ""
echo "🚀 Next Steps:"
echo "   1. Clone your repository: git clone https://github.com/psungum1/Inspection.git $PROJECT_DIR"
echo "   2. Run the deployment script: ./deploy-ubuntu.sh"
echo "   3. Access your application at: http://localhost"
echo ""
echo "📝 Useful Commands:"
echo "   • Check PostgreSQL: sudo systemctl status postgresql"
echo "   • Check Nginx: sudo systemctl status nginx"
echo "   • View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "   • PM2 status: pm2 list"
echo "   • PM2 monitor: pm2 monit"
echo ""
print_success "Your Ubuntu Desktop 24 is now ready for deployment! 🚀"
