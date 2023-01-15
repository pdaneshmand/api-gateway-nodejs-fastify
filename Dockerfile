FROM node
# Set the working directory to /dist
WORKDIR /dist
# copy package.json into the container at /dist
COPY package*.json /dist/
COPY ./.npmrc /dist/
# install dependencies
RUN npm install
RUN npm install -g typescript
# Copy the current directory contents into the container at /dist
COPY . /dist/

#Compile typescript
RUN tsc -p .

# Make port 3000 available to the world outside this container
EXPOSE 9000
# Run the app when the container launches
CMD ["npm", "start"]