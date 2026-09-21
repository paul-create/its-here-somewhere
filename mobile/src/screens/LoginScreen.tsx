import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await login(email, password);
      navigation.replace('Main');
    } catch (err) {
      // Error is already set in context, displayed below
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Sign In</Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          editable={!isLoading}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          editable={!isLoading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.disabled]}
          onPress={handleLogin}
          disabled={isLoading || !email || !password}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>Back</Text>
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
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  signInButton: {
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
  backButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#008080',
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
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