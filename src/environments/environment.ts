// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

// For production builds, this would point to your deployed API.
// For development, points to local API on port 5000
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  baseHref: '/'
};