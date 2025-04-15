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
  ActivityIndicator,
  Button
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { addDummyBookingsForOwner } from '../utils/addDummyBookings';

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

      // Query listings where ownerId matches current user
      const q = query(collection(db, 'carListings'), where('ownerId', '==', userId));
      const querySnapshot = await getDocs(q);

      const listingsData = [];
      querySnapshot.forEach((doc) => {
        listingsData.push({
          id: doc.id,
          ...doc.data()
        });
      });

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
        <ActivityIndicator size="large" color="#0000ff" />
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
            <Button
              title={addingDummyBookings ? "Adding Dummy Bookings..." : "Add Dummy Bookings (For Testing)"}
              onPress={handleAddDummyBookings}
              disabled={addingDummyBookings}
              color="#888"
            />
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  listingItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  carImage: {
    width: '100%',
    height: 180,
  },
  listingDetails: {
    padding: 12,
  },
  carModel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  licensePlate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2a9d8f',
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  bookingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  bookingItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  bookingText: {
    fontSize: 14,
    marginBottom: 4,
  },
  bookingLabel: {
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#e63946',
    padding: 8,
    borderRadius: 4,
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
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#2a9d8f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dummyBookingsContainer: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  dummyBookingsNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
