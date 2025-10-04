/**
 * Application entry point.
 *
 * This file is responsible for:
 * 1. Initializing i18next for internationalization
 * 2. Configuring the dependency injection container BEFORE React renders
 * 3. Rendering the root React application
 *
 * CRITICAL: Both i18n and configureContainer() must be initialized before
 * ReactDOM.createRoot() to ensure all services and localization are ready.
 */

// Import reflect-metadata FIRST - required by tsyringe for dependency injection
import 'reflect-metadata';

import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';
import { configureContainer } from './app/container';
// Initialize i18next
import './shared/locales';

// Initialize the DI container first
configureContainer();

// Then render the React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
