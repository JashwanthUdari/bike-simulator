# Step 1: Use Node official image
FROM node:18

# Step 2: Create app directory inside container
WORKDIR /app

# Step 3: Copy package.json first (better cache)
COPY package.json .

# Step 4: Install dependencies
RUN npm install -g http-server

# Step 5: Copy the rest of your project files
COPY . .

# Step 6: Expose the port where game will run
EXPOSE 8080

# Step 7: Start the game
CMD ["http-server", "-p", "8080"]
