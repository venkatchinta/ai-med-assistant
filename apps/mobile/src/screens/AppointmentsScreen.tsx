import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'

export default function AppointmentsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Appointments</Text>

      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>📅</Text>
        <Text style={styles.emptyStateText}>No appointments scheduled</Text>
        <Text style={styles.emptyStateSubtext}>Add appointments to track doctor visits</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
})
