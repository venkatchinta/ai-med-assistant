/**
 * Initialize the web app with shared packages and service worker
 */

import { initializeApiClient } from '@med-assistant/api-client'
import { useAuthStore, useSyncStore } from '@med-assistant/store'
import { getDeviceId } from '@med-assistant/utils'

export async function initializeApp() {
  // Initialize API client
  initializeApiClient({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 10000,
  })

  // Initialize device ID
  const deviceId = getDeviceId()
  useSyncStore.getState().setDeviceId(deviceId)

  // Register service worker
  registerServiceWorker()

  // Restore auth state
  useAuthStore.getState().hydrate()

  console.log('✓ App initialized with device ID:', deviceId)
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    })
    console.log('✓ Service Worker registered')

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New version available')
            notifyNewVersion()
          }
        })
      }
    })

    // Listen for sync from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'SYNC_REQUESTED') {
        useSyncStore.getState().setSyncing(true)
      }
    })
  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

function notifyNewVersion() {
  // Notify user that new version is available
  // Implementation depends on your UI library
  console.log('New version available - user should refresh')
}
