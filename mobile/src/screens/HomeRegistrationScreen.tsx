import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';

export function HomeRegistrationScreen({ navigation }: any) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [homeName, setHomeName] = useState('');
  const [homeCode, setHomeCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token, loginWithHome } = useAuth();

  const handleCreateHome = async () => {
    setError(null);

    if (!homeName.trim()) {
      setError('Home name is required');
      return;
    }

    if (homeName.trim().length > 255) {
      setError('Home name must be 255 characters or fewer');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/auth/create-home', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: homeName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create home');
        setIsLoading(false);
        return;
      }

      await loginWithHome(data.home_id);
      navigation.replace('Main');
    } catch (err: any) {
      setError(err.message || 'Failed to create home');
      setIsLoading(false);
    }
  };

  const handleJoinHome = async () => {
    setError(null);

    if (!homeCode.trim()) {
      setError('Home code is required');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/auth/join-home', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ home_code: homeCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to join home');
        setIsLoading(false);
        return;
      }

      await loginWithHome(data.home_id);
      navigation.replace('Main');
    } catch (err: any) {
      setError(err.message || 'Failed to join home');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (mode !== 'choose') {
      setMode('choose');
      setError(null);
      setHomeName('');
      setHomeCode('');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.form}>
        {mode === 'choose' && (
          <>
            <Text style={styles.title}>Set Up Your Home</Text>
            <Text style={styles.subtitle}>
              Would you like to create a new home or join an existing one?
            </Text>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => {
                setMode('create');
                setError(null);
              }}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="home-plus" size={24} color="#008080" />
              <View style={styles.modeButtonContent}>
                <Text style={styles.modeButtonTitle}>Create New Home</Text>
                <Text style={styles.modeButtonDescription}>
                  Start fresh with a new home inventory
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#008080" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => {
                setMode('join');
                setError(null);
              }}
              disabled={isLoading}
            >
              <MaterialCommunityIcons name="home-import-outline" size={24} color="#008080" />
              <View style={styles.modeButtonContent}>
                <Text style={styles.modeButtonTitle}>Join Existing Home</Text>
                <Text style={styles.modeButtonDescription}>
                  Enter a code to join someone else's home
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#008080" />
            </TouchableOpacity>
          </>
        )}

        {mode === 'create' && (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} disabled={isLoading}>
                <MaterialCommunityIcons name="chevron-left" size={28} color="#008080" />
              </TouchableOpacity>
              <Text style={styles.title}>Create Home</Text>
              <View style={{ width: 28 }} />
            </View>

            <Text style={styles.label}>Home Name</Text>
            <TextInput
              label="e.g., My Flat, The House, Our Place"
              value={homeName}
              onChangeText={setHomeName}
              style={styles.input}
              editable={!isLoading}
              maxLength={255}
            />

            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#d32f2f" />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.createButton, isLoading && styles.disabled]}
              onPress={handleCreateHome}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Create Home</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {mode === 'join' && (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} disabled={isLoading}>
                <MaterialCommunityIcons name="chevron-left" size={28} color="#008080" />
              </TouchableOpacity>
              <Text style={styles.title}>Join Home</Text>
              <View style={{ width: 28 }} />
            </View>

            <Text style={styles.label}>Home Code</Text>
            <TextInput
              label="Enter the 8-character code"
              value={homeCode}
              onChangeText={(text) => setHomeCode(text.toUpperCase())}
              style={styles.input}
              editable={!isLoading}
              maxLength={8}
            />
            <Text style={styles.hint}>
              Ask the home creator to share their home code
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color="#d32f2f" />
                <Text style={styles.error}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.joinButton, isLoading && styles.disabled]}
              onPress={handleJoinHome}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Join Home</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  form: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modeButtonContent: {
    flex: 1,
    marginLeft: 16,
  },
  modeButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  modeButtonDescription: {
    fontSize: 14,
    color: '#999',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    color: '#d32f2f',
    marginLeft: 8,
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#008080',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  joinButton: {
    flexDirection: 'row',
    backgroundColor: '#008080',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});