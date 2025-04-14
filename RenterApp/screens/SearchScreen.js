import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, SafeAreaView, TextInput, Image, Pressable,Modal, Button, TouchableOpacity, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from 'expo-location';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

const SearchScreen = ({ navigation }) => {
  const [region, setRegion] = useState(null);
  const [carListings, setCarListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [filteredListings, setFilteredListings] = useState([]);

  const generateConfirmationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleBooking = async (listing) => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Error', 'Please login to book a car');
        navigation.navigate('Login');
        return;
      }

      // Find all listings with bookings by this user
      const listingsRef = collection(db, 'carListings');
      const listingsSnapshot = await getDocs(listingsRef);
      
      // Remove existing bookings for this user from all listings
      const updatePromises = listingsSnapshot.docs.map(async (doc) => {
        const listingData = doc.data();
        if (listingData.bookings) {
          const updatedBookings = listingData.bookings.filter(
            booking => booking.renterUid !== auth.currentUser.uid
          );
          if (updatedBookings.length !== listingData.bookings.length) {
            await updateDoc(doc.ref, { bookings: updatedBookings });
          }
        }
      });
      
      await Promise.all(updatePromises);

      // Create new booking
      const newBooking = {
        id: Date.now().toString(),
        renterUid: auth.currentUser.uid,
        renterEmail: auth.currentUser.email,
        renterName: auth.currentUser.displayName || auth.currentUser.email,
        confirmationCode: generateConfirmationCode(),
        bookingDate: new Date(),
        status: 'confirmed'
      };

      // Add new booking to the selected listing
      const listingRef = doc(db, 'carListings', listing.id);
      await updateDoc(listingRef, {
        bookings: arrayUnion(newBooking)
      });

      // Show success message
      Alert.alert(
        'Booking Confirmed!',
        `Your booking has been confirmed!\n\nConfirmation Code: ${newBooking.confirmationCode}\nPickup Location: ${listing.address}, ${listing.city}`,
        [
          {
            text: 'View My Bookings',
            onPress: () => {
              setModalVisible(false);
              navigation.navigate('MyBookings');
            }
          },
          {
            text: 'OK',
            onPress: () => setModalVisible(false)
          }
        ]
      );

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    }
  };

  useEffect(() => {
    setupMap();
  }, []);

  useEffect(() => {
    filterListingsByCity();
  }, [searchCity, carListings]);

  const filterListingsByCity = () => {
    if (!searchCity.trim()) {
      setFilteredListings(carListings);
      return;
    }

    const filtered = carListings.filter(listing => 
      listing.city.toLowerCase().includes(searchCity.toLowerCase())
    );
    setFilteredListings(filtered);

    if (filtered.length > 0) {
      setRegion({
        latitude: filtered[0].coordinate.latitude,
        longitude: filtered[0].coordinate.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const setupMap = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission denied');
        setRegion({
          latitude: 43.6532,
          longitude: -79.3832,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      } else {
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
      await fetchAndGeocodeListings();
    } catch (error) {
      console.error('Error setting up map:', error);
    }
  };

  const fetchAndGeocodeListings = async () => {
    try {
      const listingsRef = collection(db, 'carListings');
      const snapshot = await getDocs(listingsRef);
      
      const geocodedListings = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const listing = { id: doc.id, ...doc.data() };
          try {
            const locationResult = await Location.geocodeAsync(
              `${listing.address}, ${listing.city}`
            );

            if (locationResult && locationResult.length > 0) {
              return {
                ...listing,
                coordinate: {
                  latitude: locationResult[0].latitude,
                  longitude: locationResult[0].longitude
                }
              };
            }
            return null;
          } catch (error) {
            console.error(`Geocoding error for listing ${listing.id}:`, error);
            return null;
          }
        })
      );

      const validListings = geocodedListings.filter(listing => listing !== null);
      setCarListings(validListings);
      setFilteredListings(validListings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setLoading(false);
    }
  };

  const handleMarkerPress = (listing) => {
    setSelectedListing(listing);
    setModalVisible(true);
  };

  const ListingModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.buttonContainer}>
            <Button 
              title="CLOSE"
              onPress={() => setModalVisible(false)}
            />
          </View>

          {selectedListing && (
            <>
              <Image
                source={{ uri: selectedListing.photoUrl }}
                style={styles.carImage}
                resizeMode="cover"
              />
              <View style={styles.detailsContainer}>
                <Text style={styles.carModel}>{selectedListing.carModel}</Text>
                <Text style={styles.licensePlate}>
                  License Plate: {selectedListing.licensePlate}
                </Text>
                <Text style={styles.price}>
                  ${selectedListing.costPerDay}/day
                </Text>
                <Text style={styles.ownerName}>
                  Owner: {selectedListing.ownerEmail}
                </Text>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={styles.bookButton}
                    onPress={() => handleBooking(selectedListing)}
                  >
                    <Text style={styles.bookButtonText}>BOOK NOW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  if (loading || !region) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Fetching location...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter city to search..."
          value={searchCity}
          onChangeText={setSearchCity}
          onSubmitEditing={filterListingsByCity}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Fetching location...</Text>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          <MapView 
            style={styles.map} 
            region={region}
            showsUserLocation={true}
          >
            {filteredListings.map((car) => (
              <Marker
                key={car.id}
                coordinate={car.coordinate}
                onPress={() => handleMarkerPress(car)}
              >
                <Pressable style={styles.markerContainer}>
                  <Text style={styles.markerPrice}>${car.costPerDay}</Text>
                </Pressable>
              </Marker>
            ))}
          </MapView>
        </View>
      )}
      <ListingModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        paddingTop: 0
      },
      android: {
        paddingTop: 10
      }
    })
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  mapContainer: {
    flex: 1,
    height: '80%',
    marginTop: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  markerContainer: {
    backgroundColor: 'white',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  markerPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2a9d8f',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  carImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  detailsContainer: {
    padding: 15,
  },
  carModel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  licensePlate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  price: {
    fontSize: 20,
    color: '#2a9d8f',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ownerName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  bookButton: {
    backgroundColor: '#2a9d8f',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default SearchScreen;
