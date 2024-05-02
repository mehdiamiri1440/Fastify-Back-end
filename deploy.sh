#!/bin/bash

# Navigate to the deployment directory (replace if different)
cd /home/ubuntu/pipeline-test/Fastify-Back-end

# Stop the existing application (if running) - adapt this command if needed
pm2 stop my-app-name

# Copy the new application files from the deployed directory (replace if different)
cp -r ./dist/* .

# Install dependencies (if needed, adjust based on your project setup)
npm install

# Start the application using pm2 (replace command if you use a different process manager)
pm2 start --name "inventory-backend-pipeline" npm -- run dev

# (Optional) Run migrations (if applicable)
# node ./node_modules/@jorgebodega/typeorm-seeding/dist/cli.js seed -d src/DataSource.ts src/seeders/*.ts

echo "Application deployed successfully!"
