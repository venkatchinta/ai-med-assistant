import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import * as Notifications from 'expo-notifications'
import { initializeDatabase } from '@med-assistant/mobile-db'
import { initializeMobileApiClient } from '@med-assistant/api-client'
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
        console.log('Initializing database...')
        await initializeDatabase()

        // Initialize API client
        console.log('Initializing API client...')
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'
        initializeMobileApiClient({
          baseURL: apiUrl,
        })

        // Request notification permissions
        console.log('Requesting notification permissions...')
        const { status } = await Notifications.getPermissionsAsync()
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync()
        }

        console.log('App initialized successfully')
      } catch (error) {
        console.error('Failed to initialize app:', error)
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
