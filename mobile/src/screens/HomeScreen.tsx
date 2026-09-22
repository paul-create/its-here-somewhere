import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, RefreshControl, Image } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { AppHeaderComponent } from '../components/AppHeaderComponent';

const API = 'http://192.168.1.146:3000/api';
const ITEMS_PER_PAGE = 5;
const PRIVATE_LIMIT = 50;

// Matches the columns returned by GET /api/items (sp_getAllItems + signed photo_url)
interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number | null;
  category_id: string;
  category_name: string;
  category_is_private: boolean;
  location_id: string | null;
  location_name: string | null;
  photo_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ItemsPage {
  items: Item[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function HomeScreen({ navigation }: any) {
  const [publicItems, setPublicItems] = useState<Item[]>([]);
  const [privateItems, setPrivateItems] = useState<Item[]>([]);
  const [privateTotal, setPrivateTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrivate, setShowPrivate] = useState(false);
  const currentPageRef = useRef(0);
  const listRef = useRef<FlatList<Item>>(null);
  const { token } = useAuth();

  const fetchItemsPage = async (
    visibility: 'public' | 'private',
    page: number,
    pageSize: number
  ): Promise<ItemsPage> => {
    const res = await fetch(
      `${API}/items?visibility=${visibility}&page=${page + 1}&pageSize=${pageSize}`,
      { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error('Could not load your items. Pull down to try again.');
    return res.json();
  };

  const loadPublicPage = async (page: number) => {
    let data = await fetchItemsPage('public', page, ITEMS_PER_PAGE);

    // Page no longer exists (e.g. last item on it was deleted) - step back one page
    if (data.items.length === 0 && page > 0) {
      page = page - 1;
      data = await fetchItemsPage('public', page, ITEMS_PER_PAGE);
    }

    setPublicItems(data.items);
    setTotalPages(data.totalPages);
    setCurrentPage(page);
    currentPageRef.current = page;
  };

  const loadPrivateItems = async () => {
    const data = await fetchItemsPage('private', 0, PRIVATE_LIMIT);
    setPrivateItems(data.items);
    setPrivateTotal(data.total);
  };

  const loadAll = async (page: number) => {
    if (!token) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      await Promise.all([loadPublicPage(page), loadPrivateItems()]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your items.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Runs on first load and every time you come back from Add / ItemDetails.
  // Stays on the page you were on rather than jumping back to page 1.
  useFocusEffect(
    useCallback(() => {
      loadAll(currentPageRef.current);
    }, [token])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadAll(0);
  };

  const goToPage = async (page: number) => {
    if (isPageLoading) return;
    setIsPageLoading(true);
    try {
      await loadPublicPage(page);
      setError(null);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load that page.');
    } finally {
      setIsPageLoading(false);
    }
  };

  const renderItemCard = (item: Item, isPrivate: boolean) => {
    const accent = isPrivate ? '#d32f2f' : '#008080';

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.itemCard}
        onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
      >
        <View style={styles.itemImagePlaceholder}>
          {item.photo_url ? (
            <Image source={{ uri: item.photo_url }} style={styles.itemImage} />
          ) : (
            <MaterialCommunityIcons name="package-variant" size={40} color="#cccccc" />
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={isPrivate ? styles.itemCategoryPrivate : styles.itemCategory}>
            {item.category_name || 'Uncategorised'}
          </Text>
          {item.location_id ? (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={14} color={accent} />
              <Text style={[styles.itemLocation, { color: accent }]}>
                {item.location_name ?? 'Unknown'}
              </Text>
            </View>
          ) : null}
          {item.quantity != null ? (
            <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
          ) : null}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={24} color={accent} />
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

  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

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
          ref={listRef}
          data={publicItems}
          renderItem={({ item }) => renderItemCard(item, false)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            <View>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    disabled={isFirstPage || isPageLoading}
                    onPress={() => goToPage(currentPage - 1)}
                    style={[styles.pageButton, isFirstPage && styles.pageButtonDisabled]}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={20} color={isFirstPage ? '#cccccc' : '#008080'} />
                    <Text style={[styles.pageButtonText, isFirstPage && styles.pageButtonTextDisabled]}>Previous</Text>
                  </TouchableOpacity>

                  {isPageLoading ? (
                    <ActivityIndicator size="small" color="#008080" />
                  ) : (
                    <Text style={styles.pageIndicator}>
                      {currentPage + 1} of {totalPages}
                    </Text>
                  )}

                  <TouchableOpacity
                    disabled={isLastPage || isPageLoading}
                    onPress={() => goToPage(currentPage + 1)}
                    style={[styles.pageButton, isLastPage && styles.pageButtonDisabled]}
                  >
                    <Text style={[styles.pageButtonText, isLastPage && styles.pageButtonTextDisabled]}>Next</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={isLastPage ? '#cccccc' : '#008080'} />
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
                        Private Items ({privateTotal})
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
                      {privateItems.map((item) => renderItemCard(item, true))}
                      {privateTotal > privateItems.length && (
                        <Text style={styles.privateNote}>
                          Showing your {privateItems.length} most recent of {privateTotal} private items
                        </Text>
                      )}
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
  privateNote: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 4,
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