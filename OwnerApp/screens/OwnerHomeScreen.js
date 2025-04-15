// OwnerApp/screens/OwnerHomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth, db } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { colors } from '../styles/colors';

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
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome, {userEmail}!</Text>
            <Text style={styles.roleTag}>Account Type: Owner</Text>
            <Text style={styles.subtitle}>What would you like to do today?</Text>
          </View>

          <View style={styles.cardContainer}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreateListing')}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.accent }]}>
                <Text style={styles.cardIconText}>+</Text>
              </View>
              <Text style={styles.cardTitle}>Create New Listing</Text>
              <Text style={styles.cardDescription}>Add a new car to your listings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('MyListings')}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}>
                <Text style={styles.cardIconText}>📋</Text>
              </View>
              <Text style={styles.cardTitle}>View My Listings</Text>
              <Text style={styles.cardDescription}>Manage your car listings and bookings</Text>
            </TouchableOpacity>

            {/* Test Database Connection - Commented out for production
            <TouchableOpacity
              style={[styles.actionCard, styles.testCard]}
              onPress={() => navigation.navigate('TestDBConnection')}
            >
              <View style={[styles.cardIcon, { backgroundColor: colors.warning }]}>
                <Text style={styles.cardIconText}>🔍</Text>
              </View>
              <Text style={styles.cardTitle}>Test Connection</Text>
              <Text style={styles.cardDescription}>Verify database connectivity</Text>
            </TouchableOpacity>
            */}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  headerContainer: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  roleTag: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'stretch',
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'column',
  },
  testCard: {
    opacity: 0.85,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});