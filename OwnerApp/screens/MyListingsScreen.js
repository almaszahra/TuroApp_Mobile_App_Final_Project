// OwnerApp/screens/MyListingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove, orderBy } from 'firebase/firestore';
import { addDummyBookingsForOwner } from '../utils/addDummyBookings';
import { colors } from '../styles/colors';

export default function MyListingsScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingDummyBookings, setAddingDummyBookings] = useState(false);

  // Fetch listings when component mounts
  useEffect(() => {
    const checkUserAndFetchListings = async () => {
      try {
        // First check if user is an owner
        if (!auth.currentUser) {
          navigation.replace('Login');
          return;
        }

        const ownerDocRef = doc(db, 'owners', auth.currentUser.uid);
        const ownerDoc = await getDoc(ownerDocRef);

        if (!ownerDoc.exists()) {
          Alert.alert(
            'Access Denied',
            'Only registered owners can view listings.',
            [{ text: 'OK', onPress: () => navigation.replace('Login') }]
          );
          return;
        }

        // If user is an owner, fetch listings
        fetchListings();
      } catch (error) {
        console.error('Error checking user role:', error);
        setLoading(false);
      }
    };

    checkUserAndFetchListings();
  }, [navigation]);

  // Function to fetch listings from Firestore
  const fetchListings = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser.uid;

      let listingsData = [];

      try {
        // First try with ordering (requires composite index)
        const q = query(
          collection(db, 'carListings'),
          where('ownerId', '==', userId),
          orderBy('createdAt', 'desc') // Sort by creation date, newest first
        );
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          listingsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
      } catch (indexError) {
        // If index error occurs, fall back to basic query and sort client-side
        console.log('Index not found, falling back to client-side sorting');

        const basicQuery = query(
          collection(db, 'carListings'),
          where('ownerId', '==', userId)
        );
        const querySnapshot = await getDocs(basicQuery);

        querySnapshot.forEach((doc) => {
          listingsData.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort by createdAt timestamp in descending order (newest first)
        listingsData.sort((a, b) => {
          // Handle cases where createdAt might be missing
          if (!a.createdAt) return 1;  // a is "greater" (goes to end)
          if (!b.createdAt) return -1; // b is "greater" (goes to end)

          // Convert Firestore timestamps to milliseconds for comparison
          const timeA = a.createdAt.toMillis ? a.createdAt.toMillis() : a.createdAt;
          const timeB = b.createdAt.toMillis ? b.createdAt.toMillis() : b.createdAt;

          return timeB - timeA; // Descending order (newest first)
        });
      }

      setListings(listingsData);
      console.log('Fetched listings: ', listingsData.length);
    } catch (error) {
      console.error('Error fetching listings: ', error);
      Alert.alert('Error', 'Failed to load your listings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  // Function to add dummy bookings for testing
  const handleAddDummyBookings = async () => {
    if (!auth.currentUser) return;

    try {
      setAddingDummyBookings(true);
      await addDummyBookingsForOwner(auth.currentUser.uid);
      Alert.alert('Success', 'Dummy bookings added successfully');
      // Refresh listings to show the new bookings
      fetchListings();
    } catch (error) {
      console.error('Error adding dummy bookings:', error);
      Alert.alert('Error', 'Failed to add dummy bookings');
    } finally {
      setAddingDummyBookings(false);
    }
  };

  // Function to cancel a booking
  const handleCancelBooking = async (listingId, bookingId) => {
    try {
      // Confirm cancellation
      Alert.alert(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              setLoading(true);

              // Get reference to the listing document
              const listingRef = doc(db, 'carListings', listingId);

              // Find the booking in the listings array
              const listingIndex = listings.findIndex(listing => listing.id === listingId);
              const booking = listings[listingIndex].bookings.find(booking => booking.id === bookingId);

              if (!booking) {
                Alert.alert('Error', 'Booking not found');
                setLoading(false);
                return;
              }

              // Remove the booking from the bookings array
              await updateDoc(listingRef, {
                bookings: arrayRemove(booking)
              });

              // If this was a real app connected to the RenterApp, we would also update the renter's bookings
              // For example:
              // const renterRef = doc(db, 'renters', booking.renterUid);
              // await updateDoc(renterRef, {
              //   bookings: arrayRemove({ listingId, bookingId })
              // });

              // Refresh listings
              fetchListings();

              Alert.alert('Success', 'Booking has been cancelled');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error cancelling booking: ', error);
      Alert.alert('Error', 'Failed to cancel booking');
      setLoading(false);
    }
  };

  // Render a booking item
  const renderBookingItem = ({ item: booking }, listingId) => (
    <View style={styles.bookingItem}>
      <Text style={styles.bookingText}>
        <Text style={styles.bookingLabel}>Renter: </Text>
        {booking.renterName} ({booking.renterEmail})
      </Text>
      <Text style={styles.bookingText}>
        <Text style={styles.bookingLabel}>Confirmation: </Text>
        {booking.confirmationCode}
      </Text>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => handleCancelBooking(listingId, booking.id)}
      >
        <Text style={styles.cancelButtonText}>CANCEL BOOKING</Text>
      </TouchableOpacity>
    </View>
  );

  // Render a listing item
  const renderListingItem = ({ item }) => (
    <View style={styles.listingItem}>
      <Image
        source={{ uri: item.photoUrl }}
        style={styles.carImage}
        resizeMode="cover"
      />
      <View style={styles.listingDetails}>
        <Text style={styles.carModel}>{item.carModel}</Text>
        <Text style={styles.licensePlate}>License: {item.licensePlate}</Text>
        <Text style={styles.price}>${item.costPerDay}/day</Text>
        <Text style={styles.location}>{item.city}, {item.address}</Text>

        <Text style={styles.bookingsTitle}>
          Bookings ({item.bookings?.length || 0})
        </Text>

        {item.bookings && item.bookings.length > 0 ? (
          <FlatList
            data={item.bookings}
            keyExtractor={(booking) => booking.id}
            renderItem={(bookingData) => renderBookingItem(bookingData, item.id)}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noBookings}>No bookings yet</Text>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Car Listings</Text>

      {listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>You don't have any listings yet.</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateListing')}
          >
            <Text style={styles.createButtonText}>Create Your First Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Add dummy bookings button for testing */}
          <View style={styles.dummyBookingsContainer}>
            <TouchableOpacity
              style={[styles.dummyButton, addingDummyBookings && styles.dummyButtonDisabled]}
              onPress={handleAddDummyBookings}
              disabled={addingDummyBookings}
            >
              <Text style={styles.dummyButtonText}>
                {addingDummyBookings ? "Adding Dummy Bookings..." : "Add Dummy Bookings (For Testing)"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dummyBookingsNote}>This button is for testing only. It adds random bookings to your listings.</Text>
          </View>
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderListingItem}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContainer}
        />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: colors.primary,
  },
  listContainer: {
    paddingBottom: 20,
  },
  listingItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  carImage: {
    width: '100%',
    height: 200,
  },
  listingDetails: {
    padding: 16,
  },
  carModel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  licensePlate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    marginTop: 6,
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bookingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: colors.primary,
  },
  bookingItem: {
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  bookingText: {
    fontSize: 14,
    marginBottom: 6,
    color: colors.text,
  },
  bookingLabel: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.error,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noBookings: {
    fontStyle: 'italic',
    color: colors.textSecondary,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dummyBookingsContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  dummyButton: {
    backgroundColor: colors.warning,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  dummyButtonDisabled: {
    opacity: 0.7,
  },
  dummyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dummyBookingsNote: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});
