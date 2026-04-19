import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, View } from 'react-native'
import * as SecureStore from 'expo-secure-store'

import { useAuthStore } from '@med-assistant/store'

import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import DashboardScreen from '../screens/DashboardScreen'
import FamilyScreen from '../screens/FamilyScreen'
import MedicationsScreen from '../screens/MedicationsScreen'
import LabResultsScreen from '../screens/LabResultsScreen'
import AppointmentsScreen from '../screens/AppointmentsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  )
}

function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        },
        headerTitleStyle: {
          fontWeight: '600',
          color: '#1f2937',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Health Dashboard',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          title: 'Family Members',
          tabBarLabel: 'Family',
        }}
      />
      <Tab.Screen
        name="Medications"
        component={MedicationsScreen}
        options={{
          title: 'Medications',
          tabBarLabel: 'Meds',
        }}
      />
      <Tab.Screen
        name="LabResults"
        component={LabResultsScreen}
        options={{
          title: 'Lab Results',
          tabBarLabel: 'Labs',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarLabel: 'Appts',
        }}
      />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true)
  const [userToken, setUserToken] = useState<string | null>(null)
  const { setTokens } = useAuthStore()

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token')
        const refreshToken = await SecureStore.getItemAsync('refresh_token')
        const deviceId = await SecureStore.getItemAsync('device_id')

        if (token) {
          setUserToken(token)
          setTokens({
            access_token: token,
            refresh_token: refreshToken || '',
            token_type: 'bearer',
            device_id: deviceId || 'ios-unknown',
            sync_token: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error('Error restoring token:', e)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrapAsync()
  }, [])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {userToken ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  )
}
