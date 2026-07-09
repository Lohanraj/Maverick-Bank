# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy custom nginx configuration for SPA routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files to Nginx public folder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
