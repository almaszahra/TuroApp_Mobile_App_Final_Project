// OwnerApp/App.js
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import OwnerHomeScreen from './screens/OwnerHomeScreen';
import CreateListingScreen from './screens/CreateListingScreen';
import MyListingsScreen from './screens/MyListingsScreen';
import TestDBConnection from './screens/TestDBConnection';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2a9d8f',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Login Screen */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'Owner Login',
            // Hide header for login screen
            headerShown: false
          }}
        />

        {/* Home Screen */}
        <Stack.Screen
          name="OwnerHome"
          component={OwnerHomeScreen}
          options={{ title: 'Owner Dashboard' }}
        />

        {/* Create Listing Screen */}
        <Stack.Screen
          name="CreateListing"
          component={CreateListingScreen}
          options={{ title: 'Create New Listing' }}
        />

        {/* My Listings Screen */}
        <Stack.Screen
          name="MyListings"
          component={MyListingsScreen}
          options={{ title: 'My Car Listings' }}
        />

        {/* Test Database Connection Screen */}
        <Stack.Screen
          name="TestDBConnection"
          component={TestDBConnection}
          options={{ title: 'Database Connection Test' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}