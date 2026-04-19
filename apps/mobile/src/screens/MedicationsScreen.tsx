import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const medicationSchema = z.object({
  name: z.string().min(2, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  reason: z.string().optional(),
})

type MedicationFormData = z.infer<typeof medicationSchema>

export default function MedicationsScreen() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [medications, setMedications] = useState<any[]>([])
  const [reminders, setReminders] = useState<Record<number, boolean>>({})

  const { control, handleSubmit, reset, formState: { errors } } = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosage: '',
      frequency: '',
      reason: '',
    },
  })

  const onSubmit = async (data: MedicationFormData) => {
    setLoading(true)
    try {
      const newMed = {
        id: medications.length + 1,
        ...data,
        created_at: new Date().toISOString(),
      }
      setMedications([...medications, newMed])
      reset()
      setShowAddModal(false)
      Alert.alert('Success', `${data.name} added to medications`)
    } catch (error) {
      Alert.alert('Error', 'Failed to add medication')
    } finally {
      setLoading(false)
    }
  }

  const toggleReminder = (medId: number) => {
    setReminders({
      ...reminders,
      [medId]: !reminders[medId],
    })
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Medications</Text>

        {medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💊</Text>
            <Text style={styles.emptyStateText}>No medications tracked</Text>
            <Text style={styles.emptyStateSubtext}>Add medications to track</Text>
          </View>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDetails}>{med.dosage}</Text>
                <Text style={styles.medFrequency}>{med.frequency}</Text>
                {med.reason && <Text style={styles.medReason}>{med.reason}</Text>}
              </View>
              <View style={styles.reminderControl}>
                <Text style={styles.reminderLabel}>Reminder</Text>
                <Switch
                  value={reminders[med.id] || false}
                  onValueChange={() => toggleReminder(med.id)}
                  trackColor={{ false: '#ccc', true: '#81c784' }}
                  thumbColor={reminders[med.id] ? '#4caf50' : '#f1f1f1'}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={showAddModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medication</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Medication Name *</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder="e.g., Ibuprofen"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Dosage *</Text>
                <Controller
                  control={control}
                  name="dosage"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.dosage && styles.inputError]}
                      placeholder="e.g., 500mg"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
                {errors.dosage && <Text style={styles.errorText}>{errors.dosage.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Frequency *</Text>
                <Controller
                  control={control}
                  name="frequency"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.frequency && styles.inputError]}
                      placeholder="e.g., Once daily"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
                {errors.frequency && (
                  <Text style={styles.errorText}>{errors.frequency.message}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reason (Optional)</Text>
                <Controller
                  control={control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Why are you taking this?"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Medication</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
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
  medCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  medDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  medFrequency: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  medReason: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  reminderControl: {
    alignItems: 'center',
    gap: 8,
  },
  reminderLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalForm: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
