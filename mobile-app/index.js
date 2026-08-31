import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App).
// Replaces the legacy "expo/AppEntry.js" main field, which is deprecated in
// SDK 55 and lives inside node_modules (so Babel errors were reported there).
registerRootComponent(App);
