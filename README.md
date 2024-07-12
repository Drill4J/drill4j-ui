# Drill4J UI

Web frontend to manage user accounts and API keys for Drill4J instance.  

> This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Production deployment

Drill4J UI is a simple React frontend using HTML, CSS, and JavaScript. It can be hosted in various ways.

The only requirement at the moment is that requests made by Drill4J UI to `/api/` and `/oauth/login` must be proxied to [Drill4J Backend](https://github.com/Drill4J/admin) instance.

The easiest method is using Nginx or equivalent reverse proxy.

- Refer to the [./deployment/](./deployment/) directory for the [Nginx configuration](./deployment/nginx.conf)
- Nginx can be deployed using
    - the [`docker run`](./deployment/docker-run.sh) command
    - or [Docker Compose](./deployment/docker-compose.yml) file

### Where do I get Drill4J UI application build?

You can download Drill4J UI at https://github.com/Drill4J/drill4j-ui/releases 

__Alternatively__  clone this repository and build it yourself following [./Development](#development) instructions below.

## Release

Use [release Github Action](https://github.com/Drill4J/drill4j-ui/actions/workflows/release.yml):
- Leave Version field empty to bump patch version
- Specify tag manually (`vX.Y.Z`) to bump minor or major versions

Build assets will be uploaded to https://github.com/Drill4J/drill4j-ui/releases

## Development

### Install dependencies

- Install Node.js `v20.15.0` (npm `10.7.0` at the time of writing)
- Clone this repository, navigate to repository folder
- Execute `npm install`

### Build application

- Execute `npm build`
- After the build process is finished `build` folder should appear, containing `index.html`, `static` folder and other relevant build files

### Launch application for local development

Execute `npm start` to launch the app in the development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

1. The page will reload when you make changes.
2. You may also see any lint errors in the console.

### Proxying requests

During local development requests are proxied using middleware configuration in `setupProxy.js` (see CRA [docs](https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually))

If default address `http://localhost:8090` does not work for you adjust this line:
```javascript
target: "http://localhost:8090",
```

> Q: Why not simply set ["proxy"](https://create-react-app.dev/docs/proxying-api-requests-in-development/) property in `package.json` according to CRA docs?
> 
> A: When signing in with Auth Provider user is redirected to `/oauth/login` via browser. By default, proxy ignores all requests marked with `text/html` - hence, with default setup, proxy won't cath this request and redirect won't work 

## Create React App reference - Available Scripts

In the project directory, you can run:
### `npm start`

Launches app for local development

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
