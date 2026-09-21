import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export function HomeScreen({ navigation }: any) {
  // Placeholder items - we'll wire to API later
  const [items, setItems] = useState([
    { id: '1', name: 'Hammer', category: 'Tools', location: 'Garage', image: null },
    { id: '2', name: 'Paint Cans', category: 'Supplies', location: 'Loft', image: null },
    { id: '3', name: 'Garden Hose', category: 'Garden', location: 'Shed', image: null },
  ]);

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.itemCard}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <View style={styles.itemImagePlaceholder}>
        <MaterialCommunityIcons name="package-variant" size={40} color="#cccccc" />
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <Text style={styles.itemLocation}>📍 {item.location}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color="#008080" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Items</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Add')}>
          <MaterialCommunityIcons name="plus-circle" size={28} color="#008080" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#008080',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: '#999999',
  },
});