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

export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false)
  const familyMembers = useFamilyStore((state) => state.members || [])

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Health Dashboard</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <>
          {/* Health Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Steps Today</Text>
              <Text style={styles.metricValue}>-</Text>
              <Text style={styles.metricSubtext}>From Apple Health</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Heart Rate</Text>
              <Text style={styles.metricValue}>-</Text>
              <Text style={styles.metricSubtext}>BPM</Text>
            </View>
          </View>

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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  metricCard: {
    flex: 1,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#9ca3af',
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
