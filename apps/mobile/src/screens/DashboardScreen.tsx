import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useFamilyStore } from '@med-assistant/store'
import { useHealthKit } from '../hooks/useHealthKit'

export default function DashboardScreen({ navigation }: any) {
  const familyMembers = useFamilyStore((state) => state.members || [])
  const { metrics, loading, error, refresh } = useHealthKit({
    autoInit: true,
    refreshInterval: 60000, // Refresh every minute
  })

  useEffect(() => {
    // Set up a listener for when screen focuses to refresh metrics
    const unsubscribe = navigation?.addListener('focus', () => {
      refresh()
    })
    return unsubscribe
  }, [navigation, refresh])

  const steps = metrics.steps ?? null
  const heartRate = metrics.heart_rate ?? null
  const activeEnergy = metrics.active_energy ?? null
  const workouts = metrics.workouts ?? []

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Health Dashboard</Text>
        {!loading && (
          <TouchableOpacity onPress={refresh} style={styles.refreshButton}>
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      {/* Health Metrics Cards */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Steps Today</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" style={styles.metricSpinner} />
          ) : (
            <>
              <Text style={styles.metricValue}>
                {steps ? steps.toLocaleString() : '—'}
              </Text>
              <Text style={styles.metricSubtext}>From Apple Health</Text>
            </>
          )}
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Heart Rate</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" style={styles.metricSpinner} />
          ) : (
            <>
              <Text style={styles.metricValue}>
                {heartRate ? `${heartRate}` : '—'}
              </Text>
              <Text style={styles.metricSubtext}>BPM</Text>
            </>
          )}
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Active Energy</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#2563eb" style={styles.metricSpinner} />
          ) : (
            <>
              <Text style={styles.metricValue}>
                {activeEnergy ? `${activeEnergy}` : '—'}
              </Text>
              <Text style={styles.metricSubtext}>kcal</Text>
            </>
          )}
        </View>
      </View>

      {/* Workouts Section */}
      {workouts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {workouts.map((workout, index) => (
            <View key={index} style={styles.workoutCard}>
              <View>
                <Text style={styles.workoutType}>{workout.type}</Text>
                <Text style={styles.workoutDetails}>
                  {workout.duration} min {workout.distance ? `• ${workout.distance.toFixed(1)}km` : ''}
                </Text>
                {workout.calories && (
                  <Text style={styles.workoutCalories}>{workout.calories} kcal</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

          {/* Family Members Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Family Members ({familyMembers.length})
            </Text>

            {familyMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No family members added yet</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('Family')}
                >
                  <Text style={styles.addButtonText}>+ Add Family Member</Text>
                </TouchableOpacity>
              </View>
            ) : (
              familyMembers.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberDetails}>
                      {member.age} years • {member.relationship}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Medications')}
            >
              <Text style={styles.actionTitle}>View Medications</Text>
              <Text style={styles.actionSubtext}>Check active medications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('LabResults')}
            >
              <Text style={styles.actionTitle}>Lab Results</Text>
              <Text style={styles.actionSubtext}>View health metrics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Appointments')}
            >
              <Text style={styles.actionTitle}>Appointments</Text>
              <Text style={styles.actionSubtext}>Upcoming doctor visits</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
  },
  metricsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  metricSpinner: {
    marginVertical: 12,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  workoutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  workoutDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  workoutCalories: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  memberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  memberDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
})
