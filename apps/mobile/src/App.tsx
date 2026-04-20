import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'
import { initializeDatabase } from '@med-assistant/mobile-db'
import { initializeMobileApiClient } from '@med-assistant/api-client'
import { initializeHealthKit } from '@med-assistant/health-kit-bridge'
import { RootNavigator } from './navigation/RootNavigator'

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export default function App() {
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize database
        console.log('[App] Initializing database...')
        await initializeDatabase()

        // Initialize API client
        console.log('[App] Initializing API client...')
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'
        initializeMobileApiClient({
          baseURL: apiUrl,
        })

        // Request notification permissions
        console.log('[App] Requesting notification permissions...')
        const { status } = await Notifications.getPermissionsAsync()
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync()
        }

        // Initialize HealthKit
        console.log('[App] Initializing HealthKit...')
        try {
          await initializeHealthKit()
        } catch (healthKitError) {
          console.warn('[App] HealthKit initialization failed (might be running on simulator):', healthKitError)
          // HealthKit failures are non-critical, app can continue
        }

        console.log('[App] ✓ App initialized successfully')
      } catch (error) {
        console.error('[App] ✗ Failed to initialize app:', error)
      }
    }

    initialize()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  )
}
