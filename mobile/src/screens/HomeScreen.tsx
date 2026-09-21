import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, RefreshControl, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AppHeaderComponent } from '../components/AppHeaderComponent';

interface Item {
  id: string;
  name: string;
  category_id: string;
  location_id?: string;
  quantity?: number;
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
}

export function HomeScreen({ navigation }: any) {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;
  const { token } = useAuth();

  const fetchItemsAndData = async () => {
    if (!token) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      const [itemsResponse, categoriesResponse, locationsResponse, photosResponse] = await Promise.all([
        fetch('http://192.168.1.146:3000/api/items', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('http://192.168.1.146:3000/api/categories', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('http://192.168.1.146:3000/api/locations', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('http://192.168.1.146:3000/api/photos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })
      ]);

      if (!itemsResponse.ok || !categoriesResponse.ok || !locationsResponse.ok) {
        throw new Error('Failed to load data');
      }
      
      const itemsData = await itemsResponse.json();
      const categoriesData = await categoriesResponse.json();
      const locationsData = await locationsResponse.json();
      const photosData = photosResponse.ok ? await photosResponse.json() : [];

      const itemsArray = Array.isArray(itemsData) ? itemsData : (itemsData.items || []);
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : (categoriesData.categories || []);
      const locationsArray = Array.isArray(locationsData) ? locationsData : (locationsData.locations || []);
      const photosArray = Array.isArray(photosData) ? photosData : (photosData.photos || []);

      setItems(itemsArray);
      setCategories(categoriesArray);
      setLocations(locationsArray);
      setPhotos(photosArray);
      setCurrentPage(0);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading items';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchItemsAndData();
      }
    }, [token])
  );

  // Also add this for first load
  useEffect(() => {
    if (token) {
      fetchItemsAndData();
    }
  }, [token]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItemsAndData();
  };

  const isItemPrivate = (item: Item): boolean => {
    const category = categories.find(c => c.id === item.category_id);
    //console.log(`Item: ${item.name}, Category: ${category?.name}, is_private: ${category?.is_private}`);
    return category?.is_private || false;
  };

  const { publicItems, privateItems } = useMemo(() => {
    return {
      publicItems: items.filter(item => !isItemPrivate(item)),
      privateItems: items.filter(item => isItemPrivate(item))
    };
  }, [items, categories]);

  const paginatedPublicItems = publicItems.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(publicItems.length / ITEMS_PER_PAGE) || 1;

  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Uncategorised';
  };

  const getLocationName = (locationId: string): string => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown';
  };

  const getPhotoUrl = (itemId: string): string | null => {
    const photo = photos.find(p => p.item_id === itemId);
    return photo?.s3_url || null;
  };

  const renderItem = ({ item }: any) => {
    const photoUrl = getPhotoUrl(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.itemCard}
        onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
      >
        <View style={styles.itemImagePlaceholder}>
          {photoUrl ? (
            <Image 
              source={{ uri: photoUrl }} 
              style={styles.itemImage}
            />
          ) : (
            <MaterialCommunityIcons name="package-variant" size={40} color="#cccccc" />
          )}
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{getCategoryName(item.category_id)}</Text>
          {item.location_id && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color="#008080" />
              <Text style={styles.itemLocation}>{getLocationName(item.location_id)}</Text>
            </View>
          )}
          {item.quantity && <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={24} color="#008080" />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeaderComponent />
      <View style={styles.header}>
        <Text style={styles.title}>Recently Added</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <MaterialCommunityIcons name="refresh" size={24} color="#008080" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Add')} style={styles.addButton}>
            <MaterialCommunityIcons name="plus-circle" size={28} color="#008080" />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {publicItems.length === 0 && privateItems.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <MaterialCommunityIcons name="inbox-outline" size={48} color="#cccccc" />
          <Text style={styles.emptyText}>No items yet</Text>
          <Text style={styles.emptySubtext}>Tap + to add your first item</Text>
        </View>
      ) : (
        <FlatList
          data={paginatedPublicItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View>
              {/* Pagination Controls */}
              {publicItems.length > ITEMS_PER_PAGE && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    disabled={currentPage === 0}
                    onPress={() => setCurrentPage(currentPage - 1)}
                    style={[styles.pageButton, currentPage === 0 && styles.pageButtonDisabled]}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={20} color={currentPage === 0 ? '#cccccc' : '#008080'} />
                    <Text style={[styles.pageButtonText, currentPage === 0 && styles.pageButtonTextDisabled]}>Previous</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.pageIndicator}>
                    {currentPage + 1} of {totalPages}
                  </Text>
                  
                  <TouchableOpacity
                    disabled={currentPage >= totalPages - 1}
                    onPress={() => setCurrentPage(currentPage + 1)}
                    style={[styles.pageButton, currentPage >= totalPages - 1 && styles.pageButtonDisabled]}
                  >
                    <Text style={[styles.pageButtonText, currentPage >= totalPages - 1 && styles.pageButtonTextDisabled]}>Next</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={currentPage >= totalPages - 1 ? '#cccccc' : '#008080'} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Private Items Section */}
              {privateItems.length > 0 && (
                <View style={styles.privateSection}>
                  <TouchableOpacity
                    style={styles.privateHeader}
                    onPress={() => setShowPrivate(!showPrivate)}
                  >
                    <View style={styles.privateHeaderLeft}>
                      <MaterialCommunityIcons name="lock" size={20} color="#d32f2f" />
                      <Text style={styles.privateHeaderText}>
                        Private Items ({privateItems.length})
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={showPrivate ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color="#d32f2f"
                    />
                  </TouchableOpacity>

                  {showPrivate && (
                    <View style={styles.privateItemsContainer}>
                      {privateItems.filter(item => !publicItems.some(p => p.id === item.id)).map((item) => {
                        const photoUrl = getPhotoUrl(item.id);
                        return (
                          <TouchableOpacity 
                            key={item.id} 
                            style={styles.itemCard}
                            onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
                          >
                            <View style={styles.itemImagePlaceholder}>
                              {photoUrl ? (
                                <Image 
                                  source={{ uri: photoUrl }} 
                                  style={styles.itemImage}
                                />
                              ) : (
                                <MaterialCommunityIcons name="package-variant" size={40} color="#cccccc" />
                              )}
                            </View>
                            
                            <View style={styles.itemInfo}>
                              <Text style={styles.itemName}>{item.name}</Text>
                              <Text style={styles.itemCategoryPrivate}>{getCategoryName(item.category_id)}</Text>
                              {item.location_id && (
                                <View style={styles.locationRow}>
                                  <MaterialCommunityIcons name="map-marker" size={14} color="#d32f2f" />
                                  <Text style={[styles.itemLocation, { color: '#d32f2f' }]}>{getLocationName(item.location_id)}</Text>
                                </View>
                              )}
                              {item.quantity && <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>}
                            </View>

                            <MaterialCommunityIcons name="chevron-right" size={24} color="#d32f2f" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor="#008080"
            />
          }
        />
      )}
    </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
  },
  addButton: {
    padding: 4,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 13,
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
    overflow: 'hidden',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
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
  itemCategoryPrivate: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#999999',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#008080',
    gap: 4,
  },
  pageButtonDisabled: {
    opacity: 0.5,
    borderColor: '#cccccc',
  },
  pageButtonText: {
    color: '#008080',
    fontSize: 12,
    fontWeight: '500',
  },
  pageButtonTextDisabled: {
    color: '#cccccc',
  },
  pageIndicator: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  privateSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  privateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  privateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privateHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
  },
  privateItemsContainer: {
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  itemLocation: {
    fontSize: 12,
    color: '#008080',
    fontWeight: '400',
  },
  logo: {
    width: '100%',
    height: 100,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
  },
    sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});