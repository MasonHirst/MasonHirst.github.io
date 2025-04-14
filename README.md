# Mason Hirst Portfolio

A simple portfolio site built with Angular and Bootstrap

## Steps to deploy to docker
Once your work is complete, run the command "ng build" in the root folder of the repo. This will place the build folder in the server.

## Steps to deploy on github pages
.github/workflows/deploy.yml contains the github actions workflow instructions.
The instructions trigger on pushes to the 'main' branch.
The workflow builds the Angular app, then copies the contents of 'index.html' into a new file '404.html'. This takes care of routing issues.
The workflow then copies the contents of the 'dist' folder into the 'gh-pages' branch.
The 'gh-pages' branch is the source for the GitHub Pages site, so it will deploy automatically when new files are pushed into the 'gh-pages' branch.
TLDR: push changes to Github, merge branch into 'main', the workflow will deploy the site automatically!

## Steps to run the server locally for Six-Nimmt
Run command "npm run server:wifi" in the root folder to make the server endpoint available over your local wifi network.
In another terminal, run "npm run host" to create the client side build, also available over wifi.
The server will log the IP address in the terminal, copy it.
Paste [copied IP address]:4200 into your browser. This should work for any device on the same wifi network as the host computer.
