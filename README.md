# Drill4J UI

> This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Development

### Launch application

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

## Available Scripts

In the project directory, you can run:
### `npm start`

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
