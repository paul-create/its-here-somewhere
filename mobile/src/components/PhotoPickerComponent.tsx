import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface PhotoPickerComponentProps {
  onPhotoSelected: (photo: { uri: string; type: string; name: string }) => void;
  onLoading: (loading: boolean) => void;
}

export function PhotoPickerComponent({ onPhotoSelected, onLoading }: PhotoPickerComponentProps) {
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const cameraRef = useRef<CameraView>(null);

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920, height: 1920 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (err) {
      console.error('Compression error:', err);
      return uri;
    }
  };

  const handleCameraCapture = async () => {
    if (!cameraRef.current) return;

    try {
      onLoading(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      
      if (photo) {
        const compressedUri = await compressImage(photo.uri);
        onPhotoSelected({
          uri: compressedUri,
          type: 'image/jpeg',
          name: `photo-${Date.now()}.jpg`
        });
        setCameraVisible(false);
      }
    } catch (err) {
      console.error('Camera capture error:', err);
    } finally {
      onLoading(false);
    }
  };

  const handleGallerySelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],  // Changed from MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onLoading(true);
        
        const compressedUri = await compressImage(asset.uri);
        const filename = asset.fileName || asset.uri.split('/').pop() || `photo-${Date.now()}.jpg`;
        
        onPhotoSelected({
          uri: compressedUri,
          type: asset.type || 'image/jpeg',
          name: filename
        });
      }
    } catch (err) {
      console.error('Gallery select error:', err);
    } finally {
      onLoading(false);
    }
  };

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        console.log('Camera permission denied');
        return;
      }
    }
    setCameraVisible(true);
  };

  const openGallery = async () => {
    if (!galleryPermission?.granted) {
      const permission = await requestGalleryPermission();
      if (!permission.granted) {
        console.log('Gallery permission denied');
        return;
      }
    }
    await handleGallerySelect();
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.photoButton} onPress={openCamera}>
          <MaterialCommunityIcons name="camera" size={24} color="#008080" />
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.photoButton} onPress={openGallery}>
          <MaterialCommunityIcons name="image-multiple" size={24} color="#008080" />
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={cameraVisible} animationType="slide">
        <CameraView ref={cameraRef} style={styles.camera} />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.cameraButton} onPress={() => setCameraVisible(false)}>
            <MaterialCommunityIcons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleCameraCapture}>
            <MaterialCommunityIcons name="camera-iris" size={40} color="#008080" />
          </TouchableOpacity>

          <View style={styles.cameraButtonPlaceholder} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#008080',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#008080',
    fontSize: 12,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 24,
    height: 100,
  },
  cameraButton: {
    padding: 12,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonPlaceholder: {
    width: 50,
  },
});