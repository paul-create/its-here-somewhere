import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/its_here_somewhere_app_icon-transparent.png')}
        style={styles.appIcon}
      />
      
      <Image 
        source={require('../../assets/its_here_somewhere_logo-word-transparent.png')}
        style={styles.logoText}
      />
      
      <Text style={styles.tagline}>Stop searching. Start knowing.</Text>
      
      <TouchableOpacity 
        style={styles.getStartedButton}
        onPress={() => navigation.navigate('Main')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.signInButton}
        onPress={() => {}}
      >
        <Text style={styles.signInText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  appIcon: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logoText: {
    width: 280,
    height: 80,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 48,
    textAlign: 'center',
  },
  getStartedButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#008080',
    width: '100%',
    alignItems: 'center',
  },
  signInText: {
    color: '#008080',
    fontSize: 16,
    fontWeight: '600',
  },
});