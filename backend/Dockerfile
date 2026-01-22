# Use Ubuntu as base OS
FROM ubuntu:22.04

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    build-essential

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY . .

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["npm", "start"]
