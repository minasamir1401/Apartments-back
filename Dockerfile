# Use Node (LTS)
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Install dependencies (from root package.json)
COPY package*.json ./
RUN npm install --production

# Copy all files (including client and Backend)
COPY . .

# Set Env to Production
ENV NODE_ENV=production

# Expose the server port
EXPOSE 5000

# Start command
CMD ["npm", "run", "server"]
