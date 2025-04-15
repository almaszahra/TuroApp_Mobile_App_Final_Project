// OwnerApp/screens/OwnerHomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function OwnerHomeScreen({ navigation }) {
  const [userEmail, setUserEmail] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user info
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setUserEmail(auth.currentUser.email);

        try {
          // Check if user exists in owners collection
          const ownerDocRef = doc(db, 'owners', auth.currentUser.uid);
          const ownerDoc = await getDoc(ownerDocRef);

          // If not in owners collection, they shouldn't be here
          if (!ownerDoc.exists()) {
            Alert.alert(
              'Access Denied',
              'This account is not registered as an owner.',
              [{ text: 'OK', onPress: () => handleLogout() }]
            );
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserData();

    // Set up navigation options (including logout button)
    navigation.setOptions({
      headerRight: () => (
        <Button
          onPress={handleLogout}
          title="Logout"
          color="#d00"
        />
      ),
    });
  }, [navigation]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out: ', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2a9d8f" />
      ) : (
        <>
          <Text style={styles.title}>Welcome, {userEmail}!</Text>
          <Text style={styles.roleTag}>Account Type: Owner</Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>
        </>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Create New Listing"
          onPress={() => navigation.navigate('CreateListing')}
          color="#2a9d8f"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="View My Listings"
          onPress={() => navigation.navigate('MyListings')}
          color="#457b9d"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Test Database Connection"
          onPress={() => navigation.navigate('TestDBConnection')}
          color="#888"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  roleTag: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: '#2a9d8f',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  buttonContainer: {
    marginBottom: 16,
  },
});