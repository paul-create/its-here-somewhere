import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
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
        <Text variant="headlineMedium" style={styles.title}>
          Sign In
        </Text>

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

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading || !email || !password}
          style={styles.button}
        >
          Sign In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#008080',
  },
  backButton: {
    marginTop: 8,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
});