# Stage 1: Build the Angular application
FROM node:20-alpine AS build
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (using npm ci for clean, repeatable builds)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Angular application
RUN npm run build -- --configuration=production

# Stage 2: Serve the application using Nginx
FROM nginx:alpine

# Copy custom nginx configuration for Angular routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files to Nginx public folder
COPY --from=build /app/dist/MaverickBankUI/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
