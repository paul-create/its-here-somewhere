import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';

export function AddLocationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  const handleCreateLocation = async () => {
    if (!name.trim()) {
      setError('Location name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          is_private: isPrivate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create location');
      }

      navigation.goBack();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error creating location';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <Text style={styles.label}>Location name *</Text>
        <TextInput
          placeholder="e.g. Kitchen, Bedroom, Garage"
          value={name}
          onChangeText={setName}
          mode="outlined"
          outlineColor="#e0e0e0"
          activeOutlineColor="#008080"
          style={styles.input}
        />

        <View style={styles.privacySection}>
          <TouchableOpacity
            style={[styles.checkboxContainer, isPrivate && styles.checkboxChecked]}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            {isPrivate && (
              <MaterialCommunityIcons name="check" size={20} color="#008080" />
            )}
          </TouchableOpacity>
          <View style={styles.privacyTextContainer}>
            <Text style={styles.checkboxLabel}>Private location</Text>
            <Text style={styles.privacyHint}>Only you can see this location</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.buttonDisabled]}
          onPress={handleCreateLocation}
          disabled={isLoading}
        >
          <Text style={styles.createButtonText}>
            {isLoading ? 'Creating...' : 'Create Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  form: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#008080',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#f0f0f0',
  },
  privacyTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  privacyHint: {
    fontSize: 12,
    color: '#999999',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
  },
  createButton: {
    backgroundColor: '#008080',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});