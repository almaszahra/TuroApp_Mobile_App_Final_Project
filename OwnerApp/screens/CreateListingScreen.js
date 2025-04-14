// OwnerApp/screens/CreateListingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export default function CreateListingScreen({ navigation }) {
  // Form state
  const [carModel, setCarModel] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [costPerDay, setCostPerDay] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleCreateListing = async () => {
    // Basic validation
    if (!carModel || !licensePlate || !costPerDay || !photoUrl || !city || !address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate cost is a number
    const cost = parseFloat(costPerDay);
    if (isNaN(cost) || cost <= 0) {
      Alert.alert('Error', 'Cost must be a positive number');
      return;
    }

    // Validate photo URL (basic check)
    if (!photoUrl.startsWith('http')) {
      Alert.alert('Error', 'Please enter a valid photo URL starting with http:// or https://');
      return;
    }

    setLoading(true);
    try {
      // Get current user ID and info
      const userId = auth.currentUser.uid;
      const userEmail = auth.currentUser.email;

      // Verify user is in owners collection
      const ownerDocRef = doc(db, 'owners', userId);
      const ownerDoc = await getDoc(ownerDocRef);

      if (!ownerDoc.exists()) {
        Alert.alert('Error', 'Only registered owners can create listings');
        return;
      }

      // Create new listing document
      const listingData = {
        carModel,
        licensePlate,
        costPerDay: cost,
        photoUrl,
        city,
        address,
        ownerId: userId,
        ownerEmail: userEmail,
        createdAt: serverTimestamp(),
        bookings: [] // Initialize with empty bookings array
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, 'carListings'), listingData);
      console.log('Listing created with ID: ', docRef.id);

      // Show success message
      Alert.alert(
        'Success',
        'Your car listing has been created!',
        [{ text: 'OK', onPress: () => navigation.navigate('MyListings') }]
      );
    } catch (error) {
      console.error('Error creating listing: ', error);
      Alert.alert('Error', 'Failed to create listing: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create New Car Listing</Text>

        <Text style={styles.label}>Car Model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Honda Civic"
          placeholderTextColor="#999"
          value={carModel}
          onChangeText={setCarModel}
        />

        <Text style={styles.label}>License Plate</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., ABC123"
          placeholderTextColor="#999"
          value={licensePlate}
          onChangeText={setLicensePlate}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Cost per Day ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 50"
          placeholderTextColor="#999"
          value={costPerDay}
          onChangeText={setCostPerDay}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Photo URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/car-photo.jpg"
          placeholderTextColor="#999"
          value={photoUrl}
          onChangeText={setPhotoUrl}
          keyboardType="url"
          autoCapitalize="none"
        />

        <Text style={styles.label}>City</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Toronto"
          placeholderTextColor="#999"
          value={city}
          onChangeText={setCity}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 123 Main Street"
          placeholderTextColor="#999"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.buttonContainer}>
          <Button
            title={loading ? "Creating..." : "Create Listing"}
            onPress={handleCreateListing}
            disabled={loading}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            color="#888"
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
    paddingHorizontal: 8,
    color:"rgb(0, 0, 0)",
  },
  buttonContainer: {
    marginVertical: 8,
  },
  spacer: {
    height: 40,
  }
});
