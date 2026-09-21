import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface TagEditorComponentProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagEditorComponent({ tags, onTagsChange }: TagEditorComponentProps) {
  const [newTag, setNewTag] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const addTag = () => {
    if (newTag.trim()) {
      onTagsChange([...tags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(tags[index]);
  };

  const saveEdit = (index: number) => {
    if (editingValue.trim()) {
      const updatedTags = [...tags];
      updatedTags[index] = editingValue.trim().toLowerCase();
      onTagsChange(updatedTags);
      setEditingIndex(null);
      setEditingValue('');
    }
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tags</Text>
      
      {/* Tag List */}
      {tags.length > 0 && (
        <View style={styles.tagsList}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tagItem}>
              {editingIndex === index ? (
                <View style={styles.editingContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => saveEdit(index)} style={styles.editIconButton}>
                    <MaterialCommunityIcons name="check" size={16} color="#4caf50" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={cancelEdit} style={styles.editIconButton}>
                    <MaterialCommunityIcons name="close" size={16} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.tagText}>{tag}</Text>
                  <View style={styles.tagActions}>
                    <TouchableOpacity onPress={() => startEdit(index)} style={styles.tagButton}>
                      <MaterialCommunityIcons name="pencil" size={14} color="#008080" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeTag(index)} style={styles.tagButton}>
                      <MaterialCommunityIcons name="close" size={14} color="#d32f2f" />
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Add New Tag */}
      <View style={styles.addTagContainer}>
        <TextInput
          style={styles.tagInput}
          placeholder="Add a tag..."
          placeholderTextColor="#cccccc"
          value={newTag}
          onChangeText={setNewTag}
          onSubmitEditing={addTag}
        />
        <TouchableOpacity 
          style={[styles.addButton, !newTag.trim() && styles.addButtonDisabled]} 
          onPress={addTag}
          disabled={!newTag.trim()}
        >
          <MaterialCommunityIcons 
            name="plus" 
            size={20} 
            color={newTag.trim() ? '#008080' : '#cccccc'} 
          />
        </TouchableOpacity>
      </View>

      {tags.length === 0 && (
        <Text style={styles.emptyText}>No tags yet. Add one or upload a photo for auto-generated tags.</Text>
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
  tagsList: {
    gap: 8,
    marginBottom: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tagText: {
    flex: 1,
    fontSize: 13,
    color: '#333333',
  },
  tagActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tagButton: {
    padding: 4,
  },
  editingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#008080',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    color: '#333333',
  },
  editIconButton: {
    padding: 4,
  },
  addTagContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#333333',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    borderColor: '#cccccc',
  },
  emptyText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});