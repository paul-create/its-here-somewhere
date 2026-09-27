import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface Tag {
  id: string;
  tag_name: string;
  is_auto_generated: boolean;
}

interface TagSelectorComponentProps {
  tags: Tag[];
  selectedTagIds: Set<string>;
  onTagSelect: (tagId: string) => void;
  onAddTag: (tagName: string) => Promise<void>;
  onRemoveTag: (tagId: string) => Promise<void>;
  isLoading?: boolean;
  mode?: 'view' | 'edit';
}

export function TagSelectorComponent({
  tags,
  selectedTagIds,
  onTagSelect,
  onAddTag,
  onRemoveTag,
  isLoading = false,
  mode = 'view'  // NEW: default to view
}: TagSelectorComponentProps) {
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    setIsAddingTag(true);
    try {
      await onAddTag(newTag.trim());
      setNewTag('');
    } catch (err) {
      console.error('Failed to add tag:', err);
    } finally {
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await onRemoveTag(tagId);
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tags</Text>

      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagScroll}
          contentContainerStyle={styles.tagScrollContent}
        >
          {tags.map((tag) => {
            const isSelected = selectedTagIds.has(tag.id);

            // NEW: Different rendering for edit vs view mode
            if (mode === 'edit') {
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagButton,
                    isSelected && styles.tagButtonSelected
                  ]}
                  onPress={() => onTagSelect(tag.id)}
                >
                  <Text style={[
                    styles.tagButtonText,
                    isSelected && styles.tagButtonTextSelected
                  ]}>
                    {tag.tag_name}
                  </Text>
                  {tag.is_auto_generated && (
                    <MaterialCommunityIcons
                      name="star"
                      size={12}
                      color={isSelected ? '#ffffff' : '#008080'}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              );
            } else {
              // View mode: show delete button (X)
              return (
                <View key={tag.id} style={styles.tagWithDelete}>
                  <Text style={styles.tagNameInView}>{tag.tag_name}</Text>
                  {tag.is_auto_generated && (
                    <MaterialCommunityIcons
                      name="star"
                      size={12}
                      color="#008080"
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => handleRemoveTag(tag.id)}
                    style={styles.deleteButton}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#d32f2f" />
                  </TouchableOpacity>
                </View>
              );
            }
          })}
        </ScrollView>
      )}

      {mode === 'edit' && (
        <>
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add your own tags"
              placeholderTextColor="#cccccc"
              value={newTag}
              onChangeText={setNewTag}
              editable={!isAddingTag && !isLoading}
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                (!newTag.trim() || isAddingTag || isLoading) && styles.addButtonDisabled
              ]}
              onPress={handleAddTag}
              disabled={!newTag.trim() || isAddingTag || isLoading}
            >
              {isAddingTag ? (
                <ActivityIndicator color="#008080" size={20} />
              ) : (
                <MaterialCommunityIcons
                  name="plus"
                  size={20}
                  color={newTag.trim() ? '#008080' : '#cccccc'}
                />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {tags.length === 0 && (
        <Text style={styles.emptyText}>
          No tags yet. Upload a photo for auto-generated tags or add your own below.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    marginVertical: 16, 
    paddingHorizontal: 0 
  },
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333333', 
    marginBottom: 12, 
    paddingHorizontal: 20 
  },
  tagScroll: { 
    marginBottom: 16 
  },
  tagScrollContent: { 
    paddingHorizontal: 20, 
    paddingRight: 40, 
    gap: 8 
  },
  tagButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: '#008080', 
    backgroundColor: '#ffffff' 
  },
  tagButtonSelected: { 
    backgroundColor: '#008080' 
  },
  tagButtonText: { 
    fontSize: 13, 
    color: '#008080', 
    fontWeight: '500' 
  },
  tagButtonTextSelected: { 
    color: '#ffffff' 
  },
  addTagContainer: { 
    flexDirection: 'row', 
    gap: 8, 
    alignItems: 'center', 
    paddingHorizontal: 20 
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
    backgroundColor: '#ffffff' 
  },
  addButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#008080', 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#ffffff' 
  },
  addButtonDisabled: { 
    borderColor: '#cccccc', 
    opacity: 0.5 
  },
  emptyText: { 
    fontSize: 12, 
    color: '#999999', 
    fontStyle: 'italic', 
    textAlign: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 20 
  },
  tagWithDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    gap: 4,
  },
  tagNameInView: {
    fontSize: 13,
    color: '#333333',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
});