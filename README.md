# Mason Hirst Portfolio

A simple portfolio site built with Angular and Bootstrap

## Steps to deploy to docker
Once your work is complete, run the command "ng build" in the root folder of the repo. This will place the build folder in the server.

## Steps to deploy on github pages
Once your work is complete, run the command "ng build:docs" in the root folder of the repo.
Your build should go into a folder called "docs", also in the root folder of the repo.
Go into the docs folder, and create a file called "404.html" at the same level as the "index.html" file.
Copy everything from the index.html file, and paste it into the new 404.html file.
The 404.html file is a hack to make github pages work with angular routing.
Commit and push your changes (your commit should include the docs folder).
Github will host your docs folder from the "main" branch.

## Steps to run the server locally for Six-Nimmt
Run command "npm run server:wifi" in the root folder to make the server endpoint available over your local wifi network.
In another terminal, run "npm run host" to create the client side build, also available over wifi.
The server will log the IP address in the terminal, copy it.
Paste [copied IP address]:4200 into your browser. This should work for any device on the same wifi network as the host computer.
