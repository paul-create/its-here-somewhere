import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { AppHeaderComponent } from '../components/AppHeaderComponent';

export function AddCategoryScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const handleAddCategory = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/categories', {
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
        const data = await response.json();
        throw new Error(data.error || 'Failed to create category');
      }

      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <AppHeaderComponent />
      <View style={styles.form}>
        <Text style={styles.title}>New Category</Text>

        <TextInput
          label="Category Name *"
          value={name}
          onChangeText={setName}
          style={styles.input}
          editable={!isLoading}
          placeholder="e.g., Tools, Garden, Kitchen"
        />

        <View style={styles.privacySection}>
          <TouchableOpacity
            style={styles.privacyToggle}
            onPress={() => setIsPrivate(!isPrivate)}
            disabled={isLoading}
          >
            <MaterialCommunityIcons
              name={isPrivate ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color="#008080"
            />
            <Text style={styles.privacyLabel}>Keep this category private</Text>
          </TouchableOpacity>
          <Text style={styles.privacyHint}>Private categories are only visible to you</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.createButton, (isLoading || !name.trim()) && styles.disabled]}
          onPress={handleAddCategory}
          disabled={isLoading || !name.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Create Category</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  form: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  input: {
    marginBottom: 12,
  },
  privacySection: {
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    color: '#333333',
  },
  privacyHint: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 36,
  },
  createButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#008080',
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    color: '#008080',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
});