import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface PhotoPreviewComponentProps {
  photoUri: string;
  onRetake: () => void;
  isUploading: boolean;
  uploadProgress?: number;
}

export function PhotoPreviewComponent({ photoUri, onRetake, isUploading, uploadProgress }: PhotoPreviewComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photo Preview</Text>
      
      <View style={styles.previewContainer}>
        <Image source={{ uri: photoUri }} style={styles.preview} />
        
        {isUploading && (
          <View style={styles.uploadOverlay}>
            <ActivityIndicator size="large" color="#008080" />
            <Text style={styles.uploadText}>Uploading...</Text>
            {uploadProgress && (
              <Text style={styles.progressText}>{Math.round(uploadProgress * 100)}%</Text>
            )}
          </View>
        )}
      </View>

      {!isUploading && (
        <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
          <MaterialCommunityIcons name="camera-retake" size={20} color="#008080" />
          <Text style={styles.retakeText}>Retake Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  uploadText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    color: '#008080',
    fontSize: 12,
    fontWeight: '500',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#008080',
    borderRadius: 6,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  retakeText: {
    color: '#008080',
    fontSize: 13,
    fontWeight: '500',
  },
});