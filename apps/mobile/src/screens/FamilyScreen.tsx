import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFamilyStore } from '@med-assistant/store'

const familyMemberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  age: z.coerce.number().int().positive('Age must be positive'),
  relationship: z.string().min(2, 'Relationship is required'),
})

type FamilyMemberFormData = z.infer<typeof familyMemberSchema>

export default function FamilyScreen() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const members = useFamilyStore((state) => state.members || [])
  const { addMember } = useFamilyStore()
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FamilyMemberFormData>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      name: '',
      age: undefined,
      relationship: '',
    },
  })

  const onSubmit = async (data: FamilyMemberFormData) => {
    setLoading(true)
    try {
      // Simulate adding member
      const newMember = {
        id: members.length + 1,
        user_id: 1,
        name: data.name,
        age: data.age,
        relationship: data.relationship,
        created_at: new Date().toISOString(),
      }
      addMember(newMember)
      reset()
      setShowAddModal(false)
      Alert.alert('Success', `${data.name} added to family`)
    } catch (error) {
      Alert.alert('Error', 'Failed to add family member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Family Members</Text>

        {members.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.emptyStateText}>No family members yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add family members to start tracking their health
            </Text>
          </View>
        ) : (
          members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberDetails}>
                  {member.age} years • {member.relationship}
                </Text>
                {member.blood_type && (
                  <Text style={styles.memberAttribute}>Blood Type: {member.blood_type}</Text>
                )}
                {member.allergies && (
                  <Text style={styles.memberAttribute}>Allergies: {member.allergies}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
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
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.name && styles.inputError]}
                      placeholder="Enter name"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
                {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Age *</Text>
                <Controller
                  control={control}
                  name="age"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.age && styles.inputError]}
                      placeholder="Enter age"
                      value={value?.toString()}
                      onChangeText={onChange}
                      keyboardType="number-pad"
                      editable={!loading}
                    />
                  )}
                />
                {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Relationship *</Text>
                <Controller
                  control={control}
                  name="relationship"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[styles.input, errors.relationship && styles.inputError]}
                      placeholder="e.g., Spouse, Parent, Child"
                      value={value}
                      onChangeText={onChange}
                      editable={!loading}
                    />
                  )}
                />
                {errors.relationship && (
                  <Text style={styles.errorText}>{errors.relationship.message}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Member</Text>
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  memberCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
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
    marginBottom: 4,
  },
  memberAttribute: {
    fontSize: 12,
    color: '#9ca3af',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#2563eb',
    fontWeight: '600',
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
