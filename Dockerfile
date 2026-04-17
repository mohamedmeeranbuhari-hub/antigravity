# Stage 1: Build the Vite application
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx for maximum performance
FROM nginx:alpine
# Copy the built assets to the Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default Nginx configuration to support client-side routing
RUN echo "server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Expose the Cloud Run default port (8080 is common, Cloud Run sets PORT authmatically but Nginx config needs to listen on it)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
