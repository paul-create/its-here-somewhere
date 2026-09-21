import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';
import { LoginScreen } from './src/screens/LoginScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={BottomTabNavigator} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}