# Use Node 18 as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml (if you have one)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of your app's source code
COPY . .

# Expose the port your Fastify app runs on (adjust if needed)
EXPOSE 3000

# Start the app
CMD ["node", "src/index.js"]