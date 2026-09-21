import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const passwordRequirementsMet = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  const showRequirements = password.length > 0; // Auto-show when typing starts

  const handleSignup = async () => {
    setError(null);

    // Client-side validation
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!passwordRequirementsMet) {
      setError('Password must contain 8+ characters, uppercase, lowercase, number, and special character');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Call signup endpoint
      const response = await fetch('http://192.168.1.146:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || 'Signup failed. Please try again.';
        
        // Check if user already exists
        if (errorMsg.includes('User account already exists') || errorMsg.includes('already exists')) {
            // Navigate to login screen with the email pre-filled and existing user flag
            navigation.replace('Login', { email, existingUser: true });
            return;
        }

        throw new Error(errorMsg);
      }

      // Signup successful - now auto-login
      const loginResponse = await fetch('http://192.168.1.146:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error('Account created, but login failed. Please try logging in manually.');
      }

      // Navigate to Main
      navigation.replace('Main');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Signup failed';
      // Hide backend details from user
      const friendlyMsg = errorMsg.includes('Cognito') 
        ? 'An error occurred. Please try again.'
        : errorMsg;
      setError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>

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

        {showRequirements && (
          <View style={styles.requirementsBox}>
            <RequirementRow 
              met={hasMinLength} 
              text="At least 8 characters" 
            />
            <RequirementRow 
              met={hasUpperCase} 
              text="One uppercase letter (A-Z)" 
            />
            <RequirementRow 
              met={hasLowerCase} 
              text="One lowercase letter (a-z)" 
            />
            <RequirementRow 
              met={hasNumber} 
              text="One number (0-9)" 
            />
            <RequirementRow 
              met={hasSpecialChar} 
              text="One special character (!@#$%^&*)" 
            />
          </View>
        )}

        <View style={styles.passwordInputContainer}>
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            style={styles.passwordInput}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <MaterialCommunityIcons 
              name={showConfirmPassword ? "eye-off" : "eye"} 
              size={24} 
              color="#008080" 
            />
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.signupButton, (isLoading || !passwordRequirementsMet || password !== confirmPassword) && styles.disabled]}
          onPress={handleSignup}
          disabled={isLoading || !email || !password || !confirmPassword || !passwordRequirementsMet}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
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

function RequirementRow({ met, text }: { met: boolean; text: string }) {
  return (
    <View style={styles.requirementRow}>
      <MaterialCommunityIcons 
        name={met ? "check-circle" : "circle-outline"} 
        size={18} 
        color={met ? "#4caf50" : "#cccccc"} 
      />
      <Text style={[styles.requirementText, met && styles.requirementMet]}>
        {text}
      </Text>
    </View>
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  input: {
    marginBottom: 12,
  },
  requirementsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#008080',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
    flex: 1,
  },
  requirementMet: {
    color: '#4caf50',
    fontWeight: '500',
  },
  signupButton: {
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