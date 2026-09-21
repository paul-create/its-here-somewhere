import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator, Image, Alert, Modal } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { PhotoPickerComponent } from '../components/PhotoPickerComponent';
import { PhotoPreviewComponent } from '../components/PhotoPreviewComponent';

interface Item {
  id: string;
  name: string;
  description: string;
  quantity: number;
  category_id: string;
  location_id?: string;
}

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
  id: string;
  item_id: string;
  s3_url: string;
  uri?: string; // For temporary local photos
}

interface Activity {
  id: string;
  property: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  changed_by_email: string;
}

type TempPhoto = { uri: string; type: string; name: string };

export function ItemDetailsScreen({ navigation, route }: any) {
  const { itemId } = route.params;
  const [item, setItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newPhoto, setNewPhoto] = useState<TempPhoto | null>(null);
  const { token } = useAuth();

  const fetchData = async () => {
    if (!token) return;

    try {
      setIsLoading(true);

      const [itemRes, categoriesRes, locationsRes, photosRes, activityRes] = await Promise.all([
        fetch(`http://192.168.1.146:3000/api/items/${itemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://192.168.1.146:3000/api/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://192.168.1.146:3000/api/locations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://192.168.1.146:3000/api/photos', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://192.168.1.146:3000/api/items/${itemId}/activity`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (itemRes.ok) {
        const itemData = await itemRes.json();
        setItem(itemData);
      }

      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        setCategories(Array.isArray(catData) ? catData : (catData.categories || []));
      }

      if (locationsRes.ok) {
        const locData = await locationsRes.json();
        setLocations(Array.isArray(locData) ? locData : (locData.locations || []));
      }

      if (photosRes.ok) {
        const photosData = await photosRes.json();
        const photosArray = Array.isArray(photosData) ? photosData : (photosData.photos || []);
        const itemPhoto = photosArray.find((p: Photo) => p.item_id === itemId);
        setPhoto(itemPhoto || null);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivity(Array.isArray(activityData) ? activityData : []);
      }
    } catch (err) {
      console.error('Error fetching item details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [token, itemId])
  );

  useEffect(() => {
    if (item) {
      setEditName(item.name);
      setEditDescription(item.description || '');
    }
  }, [item]);

  const getCategoryName = (categoryId: string): string => {
    return categories.find(c => c.id === categoryId)?.name || 'Uncategorised';
  };

  const getLocationName = (locationId: string): string => {
    return locations.find(l => l.id === locationId)?.name || 'Unknown';
  };

  const handleMoveItem = async (newLocationId: string) => {
    if (!token) return;

    try {
      const res = await fetch(`http://192.168.1.146:3000/api/items/${itemId}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ location_id: newLocationId }),
      });

      if (res.ok) {
        setShowMoveModal(false);
        fetchData();
        Alert.alert('Success', 'Item location updated');
      } else {
        throw new Error('Failed to move item');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to move item');
    }
  };

  const handleReplacePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setNewPhoto({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo-${Date.now()}.jpg`
        });
      }
    } catch (err) {
      console.error('Error selecting photo:', err);
    }
  };

  const handleSaveEdits = async () => {
    if (!token) return;

    if (!editName.trim()) {
      Alert.alert('Error', 'Item name cannot be empty');
      return;
    }

    try {
      // Update item name and description
      const updateRes = await fetch(`http://192.168.1.146:3000/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });

      if (!updateRes.ok) throw new Error('Failed to update item');

      // If photo was replaced, delete old and upload new
      if (newPhoto && newPhoto.uri) {
        // Delete old photo
        if (photo) {
          await fetch(`http://192.168.1.146:3000/api/photos/${photo.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }

        // Upload new photo
        const formDataObj = new FormData();
        formDataObj.append('file', {
          uri: newPhoto.uri,
          type: 'image/jpeg',
          name: `photo-${Date.now()}.jpg`,
        } as any);

        const photoRes = await axios.post(
          `http://192.168.1.146:3000/api/photos?itemId=${itemId}`,
          formDataObj,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );

        setNewPhoto(null);
      }

      setIsEditing(false);
      fetchData();
      Alert.alert('Success', 'Item updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to save changes');
      console.error(err);
    }
  };

  const handleDeleteItem = async () => {
    Alert.alert(
      'Delete Item',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const res = await fetch(`http://192.168.1.146:3000/api/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (res.ok) {
                navigation.goBack();
                Alert.alert('Deleted', 'Item has been deleted');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
          style: 'destructive',
        }
      ]
    );
  };

  const formatActivityDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const groupActivityByDate = (): { [key: string]: Activity[] } => {
    const grouped: { [key: string]: Activity[] } = {};
    activity.forEach(act => {
      const date = formatActivityDate(act.changed_at);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(act);
    });
    return grouped;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  const groupedActivity = groupActivityByDate();
  const isPrivate = categories.find(c => c.id === item.category_id)?.is_private || false;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#008080" />
          </TouchableOpacity>
           <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => {
              if (!isEditing && item) {
                setEditName(item.name);
                setEditDescription(item.description || '');
              }
              setIsEditing(!isEditing);
            }}>
              <MaterialCommunityIcons name={isEditing ? 'close' : 'pencil'} size={24} color="#008080" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteItem}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Section */}
        {newPhoto ? (
          <Image source={{ uri: newPhoto.uri }} style={styles.itemPhoto} />
        ) : photo ? (
          <Image source={{ uri: photo.s3_url }} style={styles.itemPhoto} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <MaterialCommunityIcons name="package-variant" size={80} color="#cccccc" />
          </View>
        )}

        {isEditing && !newPhoto && (
          <View style={styles.photoPickerContainer}>
            <PhotoPickerComponent 
              onPhotoSelected={(photo) => setNewPhoto(photo)}
              onLoading={setIsUploading}
            />
          </View>
        )}

        {isEditing && newPhoto && (
          <PhotoPreviewComponent
            photoUri={newPhoto.uri!}
            onRetake={() => setNewPhoto(null)}
            isUploading={isUploading}
          />
        )}

        {/* Item Details */}
        <View style={styles.detailsSection}>
          {isEditing ? (
            <>
              <TextInput
                style={styles.editInput}
                placeholder="Item name"
                value={editName}
                onChangeText={setEditName}
              />
              <TextInput
                style={[styles.editInput, styles.descriptionInput]}
                placeholder="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdits}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.itemName, isPrivate && styles.privateText]}>{item.name}</Text>
              {item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}
            </>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Category</Text>
            <Text style={[styles.metaValue, isPrivate && styles.privateText]}>
              {getCategoryName(item.category_id)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Location</Text>
            <Text style={styles.metaValue}>{getLocationName(item.location_id || '')}</Text>
          </View>

          {!isEditing && (
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => setShowMoveModal(true)}
            >
              <MaterialCommunityIcons name="map-marker" size={18} color="#ffffff" />
              <Text style={styles.moveButtonText}>Move Item</Text>
            </TouchableOpacity>
          )}

          {item.quantity && item.quantity > 1 && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Quantity</Text>
              <Text style={styles.metaValue}>{item.quantity}</Text>
            </View>
          )}
        </View>

        {/* Activity History */}
        {activity.length > 0 && (
            <View style={styles.activitySection}>
            <Text style={styles.activityTitle}>History</Text>
            {Object.entries(groupedActivity).map(([date, acts]) => (
                <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                {acts.map((act, idx) => (
                    <View key={act.id} style={styles.activityEntry}>
                    <Text style={styles.propertyName}>{act.property}</Text>
                    <View style={styles.changeRow}>
                        <Text style={styles.oldValue}>{act.old_value || 'New'}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#999999" />
                        <Text style={styles.newValue}>{act.new_value}</Text>
                    </View>
                    </View>
                ))}
                </View>
            ))}
            </View>
        )}

        {/* Move Modal */}
        <Modal visible={showMoveModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select New Location</Text>
                <TouchableOpacity onPress={() => setShowMoveModal(false)}>
                    <MaterialCommunityIcons name="close" size={24} color="#333333" />
                </TouchableOpacity>
                </View>
                <ScrollView style={styles.locationList}>
                {locations.map((loc) => (
                    <TouchableOpacity
                    key={loc.id}
                    style={styles.locationOption}
                    onPress={() => handleMoveItem(loc.id)}
                    >
                    <Text style={styles.locationOptionText}>{loc.name}</Text>
                    {loc.is_private && <Text style={styles.privateLabel}>(Private)</Text>}
                    </TouchableOpacity>
                ))}
                </ScrollView>
            </View>
            </View>
        </Modal>

        <View style={{ height: 20 }} />
        </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  itemPhoto: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
  },
  photoPlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  privateText: {
    color: '#d32f2f',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  metaValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  moveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#008080',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  moveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333333',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  activityEntry: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#008080',
  },
  propertyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#008080',
    marginBottom: 6,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oldValue: {
    fontSize: 13,
    color: '#d32f2f',
    fontWeight: '500',
  },
  newValue: {
    fontSize: 13,
    color: '#00a86b',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  locationList: {
    paddingHorizontal: 20,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  privateLabel: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
  },
  descriptionInput: {
    textAlignVertical: 'top',
    height: 90,
  },
  saveButton: {
    backgroundColor: '#008080',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoEditButtons: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  photoEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  photoEditButtonText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '500',
  },
  photoPickerContainer: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
});