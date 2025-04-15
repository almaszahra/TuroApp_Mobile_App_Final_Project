// OwnerApp/screens/CreateListingScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { colors } from '../styles/colors';

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
        [{ text: 'OK', onPress: () => navigation.replace('MyListings') }]
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
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create New Car Listing</Text>
        <Text style={styles.subtitle}>Enter your car details below</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Car Model</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Honda Civic"
            placeholderTextColor={colors.textSecondary}
            value={carModel}
            onChangeText={setCarModel}
          />

          <Text style={styles.label}>License Plate</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ABC123"
            placeholderTextColor={colors.textSecondary}
            value={licensePlate}
            onChangeText={setLicensePlate}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Cost per Day ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50"
            placeholderTextColor={colors.textSecondary}
            value={costPerDay}
            onChangeText={setCostPerDay}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Photo URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/car-photo.jpg"
            placeholderTextColor={colors.textSecondary}
            value={photoUrl}
            onChangeText={setPhotoUrl}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Toronto"
            placeholderTextColor={colors.textSecondary}
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 123 Main Street"
            placeholderTextColor={colors.textSecondary}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateListing}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Creating..." : "Create Listing"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    color: colors.text,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 10,
  },
  createButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: colors.background,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.secondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  spacer: {
    height: 40,
  }
});
