# Use a specific Node.js version in Alpine for a smaller footprint
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy dependencies and built application from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/swagger.yaml ./

# Ensure code runs as non-root user for better security
USER node

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
