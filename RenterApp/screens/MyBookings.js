import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, FlatList, Button, Alert,} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

export default function MyBookings({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      if (!auth.currentUser) {
        navigation.replace('Login');
        return;
      }

      setLoading(true);
      const bookingsData = [];
      
      const listingsRef = collection(db, 'carListings');
      const querySnapshot = await getDocs(listingsRef);
      
      querySnapshot.forEach((doc) => {
        const listing = doc.data();
        if (listing.bookings && listing.bookings.length > 0) {
          const renterBookings = listing.bookings.filter(
            booking => booking.renterUid === auth.currentUser.uid
          );
          
          renterBookings.forEach(booking => {
            bookingsData.push({
              ...booking,
              listingId: doc.id,
              carModel: listing.carModel,
              address: listing.address,
              city: listing.city
            });
          });
        }
      });

      setBookings(bookingsData);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load your bookings');
      setLoading(false);
    }
  };

  const handleCancelBooking = async (listingId, booking) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setLoading(true);
              
              const listingRef = doc(db, 'carListings', listingId);
              const listingDoc = await getDoc(listingRef);
              
              if (listingDoc.exists()) {
                const listingData = listingDoc.data();
                const updatedBookings = listingData.bookings.filter(
                  b => b.id !== booking.id
                );
                
                await updateDoc(listingRef, {
                  bookings: updatedBookings
                });
                
                await fetchBookings();
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <Text style={styles.carModel}>{item.carModel}</Text>
      <Text style={styles.confirmationCode}>
        Confirmation Code: {item.confirmationCode}
      </Text>
      <Text style={styles.location}>
        Pickup Location: {item.address}, {item.city}
      </Text>
      <Button
        title="Cancel Booking"
        onPress={() => handleCancelBooking(item.listingId, item)}
        color="#ff4444"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Fetching Booking Information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>
      
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            You don't have any active bookings.
          </Text>
          <Button
            title="Search Available Cars"
            onPress={() => navigation.navigate('SearchScreen')}
            color="#2a9d8f"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  carModel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  confirmationCode: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
    textAlign: 'center',
  }
});
