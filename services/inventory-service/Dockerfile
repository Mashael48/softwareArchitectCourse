# Start from the official Node.js 20 Alpine image
# Alpine is a lightweight Linux distribution
FROM node:20-alpine

WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application source code
COPY src ./src

# Expose the Entity Service port
EXPOSE 3002

# Run as the built-in non-root Node user
USER node

# Start the application
CMD ["npm", "start"]