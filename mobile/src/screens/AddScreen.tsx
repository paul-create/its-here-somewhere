import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { TextInput } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { PhotoPickerComponent } from '../components/PhotoPickerComponent';
import { PhotoPreviewComponent } from '../components/PhotoPreviewComponent';
import { TagEditorComponent } from '../components/TagEditorComponent';
import axios from 'axios';
import { AppHeaderComponent } from '../components/AppHeaderComponent';

interface Category {
  id: string;
  name: string;
  is_private: boolean;
}

interface Location {
  id: string;
  name: string;
  is_private: boolean;
}

interface Photo {
  uri: string;
  type: string;
  name: string;
}

export function AddScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoTags, setPhotoTags] = useState<string[]>([]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { token } = useAuth();

  const fetchCategories = async () => {
    if (!token) return;
    setIsLoadingCategories(true);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const categoriesArray = Array.isArray(data) ? data : (data.categories || []);
      setCategories(categoriesArray);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchLocations = async () => {
    if (!token) return;
    setIsLoadingLocations(true);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const locationsArray = Array.isArray(data) ? data : (data.locations || []);
      setLocations(locationsArray);
    } catch (err) {
      console.error('Error loading locations:', err);
      setError('Failed to load locations');
    } finally {
      setIsLoadingLocations(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCategories();
      fetchLocations();
    }, [token])
  );

  const uploadPhotoAndGetTags = async (itemId: string): Promise<boolean> => {
    if (!selectedPhoto || !token) return false;

    try {
      setIsUploading(true);

      const formDataObj = new FormData();
      formDataObj.append('file', {
        uri: selectedPhoto.uri,
        type: 'image/jpeg',
        name: selectedPhoto.name,
      } as any);

      const photoRes = await axios.post(
        `http://192.168.1.146:3000/api/photos?itemId=${itemId}`,
        formDataObj,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      setPhotoTags(photoRes.data.tags || []);
      return true;
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Failed to upload photo');
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = async () => {
    if (isLoading || isUploading) {
      return;  // Prevent double-tap
    }
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!selectedCategory) {
      setError('Please select a category');
      return;
    }
    if (!selectedLocation) {
      setError('Please select a location');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.146:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          quantity: parseInt(quantity) || 1,
          category_id: selectedCategory.id,
          location_id: selectedLocation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      const itemData = await response.json();
      const itemId = itemData.id;

      // Upload photo if selected
      if (selectedPhoto) {
        const uploadSuccess = await uploadPhotoAndGetTags(itemId);
        if (!uploadSuccess) {
          return;
        }
      }

      Alert.alert('Success', 'Item added successfully!');
      setName('');
      setDescription('');
      setQuantity('1');
      setSelectedCategory(null);
      setSelectedLocation(null);
      setSelectedPhoto(null);
      setPhotoTags([]);
      setError(null);
      navigation.goBack();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error creating item';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryOption = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.modalOption}
      onPress={() => {
        setSelectedCategory(item);
        setShowCategoryModal(false);
      }}
    >
      <Text style={styles.modalOptionText}>{item.name}</Text>
      {item.is_private && <Text style={styles.privateLabel}>(Private)</Text>}
    </TouchableOpacity>
  );

  const renderLocationOption = ({ item }: { item: Location }) => (
    <TouchableOpacity
      style={styles.modalOption}
      onPress={() => {
        setSelectedLocation(item);
        setShowLocationModal(false);
      }}
    >
      <Text style={styles.modalOptionText}>{item.name}</Text>
      {item.is_private && <Text style={styles.privateLabel}>(Private)</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AppHeaderComponent />
      <View style={styles.header}>
      <Text style={styles.title}>Add Item</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Item name *</Text>
        <TextInput
          placeholder="e.g. Jade Plant"
          value={name}
          onChangeText={setName}
          mode="outlined"
          outlineColor="#e0e0e0"
          activeOutlineColor="#008080"
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Optional details"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          outlineColor="#e0e0e0"
          activeOutlineColor="#008080"
          style={styles.input}
        />

        {/* Photo Picker */}
        {!selectedPhoto && (
          <PhotoPickerComponent 
            onPhotoSelected={setSelectedPhoto}
            onLoading={setIsUploading}
          />
        )}

        {/* Photo Preview */}
        {selectedPhoto && (
          <PhotoPreviewComponent
            photoUri={selectedPhoto.uri}
            onRetake={() => {
              setSelectedPhoto(null);
              setPhotoTags([]);
            }}
            isUploading={isUploading}
          />
        )}

        {/* Tags Editor */}
        {selectedPhoto && photoTags.length > 0 && (
          <TagEditorComponent 
            tags={photoTags}
            onTagsChange={setPhotoTags}
          />
        )}

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          placeholder="1"
          value={quantity}
          onChangeText={setQuantity}
          mode="outlined"
          outlineColor="#e0e0e0"
          activeOutlineColor="#008080"
          keyboardType="numeric"
          style={styles.input}
        />

        <Text style={styles.label}>Category *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowCategoryModal(true)}
        >
          <Text style={selectedCategory ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
            {selectedCategory ? selectedCategory.name : 'Select a category'}
          </Text>
          <View style={styles.pickerButtonRight}>
            {selectedCategory && <Text style={styles.categoryPrivateLabel}>{selectedCategory.is_private ? '(Private)' : ''}</Text>}
            <MaterialCommunityIcons name="chevron-down" size={20} color="#008080" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addNewButton}
          onPress={() => navigation.navigate('AddCategory')}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#008080" />
          <Text style={styles.addNewButtonText}>New category</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Location *</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowLocationModal(true)}
        >
          <Text style={selectedLocation ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
            {selectedLocation ? selectedLocation.name : 'Select a location'}
          </Text>
          <View style={styles.pickerButtonRight}>
            {selectedLocation && <Text style={styles.locationPrivateLabel}>{selectedLocation.is_private ? '(Private)' : ''}</Text>}
            <MaterialCommunityIcons name="chevron-down" size={20} color="#008080" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addNewButton}
          onPress={() => navigation.navigate('AddLocation')}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#008080" />
          <Text style={styles.addNewButtonText}>New location</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.addButton, (isLoading || isUploading) && styles.buttonDisabled]}
          onPress={handleAddItem}
          disabled={isLoading || isUploading}
        >
          <Text style={styles.addButtonText}>
            {isLoading ? 'Adding...' : isUploading ? 'Uploading photo...' : 'Add Item'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            {isLoadingCategories ? (
              <ActivityIndicator size="large" color="#008080" />
            ) : categories.length === 0 ? (
              <Text style={styles.emptyText}>No categories found</Text>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategoryOption}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            {isLoadingCategories ? (
              <ActivityIndicator size="large" color="#008080" />
            ) : categories.length === 0 ? (
              <Text style={styles.emptyText}>No categories found</Text>
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategoryOption}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            {isLoadingLocations ? (
              <ActivityIndicator size="large" color="#008080" />
            ) : locations.length === 0 ? (
              <Text style={styles.emptyText}>No locations found</Text>
            ) : (
              <FlatList
                data={locations}
                renderItem={renderLocationOption}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
              />
            )}
          </View>
        </View>
      </Modal>
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
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  input: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  pickerButtonPlaceholder: {
    fontSize: 16,
    color: '#999999',
    flex: 1,
  },
  pickerButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryPrivateLabel: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  locationPrivateLabel: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 24,
    gap: 8,
  },
  addNewButtonText: {
    fontSize: 14,
    color: '#008080',
    fontWeight: '500',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: '#008080',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  privateLabel: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingVertical: 20,
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
});