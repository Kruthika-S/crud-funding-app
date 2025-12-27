# Use Ubuntu as base OS
FROM ubuntu:22.04

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    build-essential

# Install Node.js INSIDE container
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory inside container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install node dependencies
RUN npm install

# Copy remaining backend files
COPY . .

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
