import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export const AppHeaderComponent = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerContainer}>
        <Image 
          source={require('../../assets/its_here_somewhere_logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity 
          onPress={() => navigation.navigate('More')}
          style={styles.gearButton}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#008080" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  safeArea: {
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    height: 100,
    width: 200,
  },
  gearButton: {
    padding: 8,
  },
};