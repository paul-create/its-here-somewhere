import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';

export function LoginScreen({ navigation, route }: any) {
  const [email, setEmail] = useState(route?.params?.email || '');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const existingUser = route?.params?.existingUser || false;

  const handleLogin = async () => {
    try {
      const loginResult = await login(email, password);
      // Check if homeId exists - if null, user needs to create/join a home
      if (loginResult?.homeId === null) {
        navigation.replace('HomeRegistration');
      } else {
        navigation.replace('Main');
      }
    } catch (err) {
      // Error is already set in context
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.form}>
        <Text style={styles.title}>Sign In</Text>

        {existingUser && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Looks like we know you. Just sign in below or reset your password if you've forgotten it.
            </Text>
          </View>
        )}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          editable={!isLoading}
        />

        <View style={styles.passwordInputContainer}>
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons 
              name={showPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#008080" 
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>{error}</Text>
            {error.toLowerCase().includes('failed') && (
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.disabled]}
          onPress={handleLogin}
          disabled={isLoading || !email || !password}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => navigation.navigate('ForgotPassword')}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>Reset Password</Text>
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
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  infoText: {
    fontSize: 13,
    color: '#2e7d32',
    lineHeight: 18,
  },
  input: {
    marginBottom: 12,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  errorContainer: {
    marginBottom: 16,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  forgotPasswordLink: {
    color: '#008080',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  signInButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    paddingHorizontal: 48,
    paddingVertical: 12,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  backButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#008080',
    marginTop: 16,
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
});