// RenterApp/App.js
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import RenterHomeScreen from './screens/RenterHomeScreen';
import TestDBConnection from './screens/TestDBConnection';
import SearchScreen from './screens/SearchScreen';
import MyBookings from './screens/MyBookings';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Login Screen */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Renter Login' }}
        />
        {/* Home Screen */}
        <Stack.Screen
          name="RenterHome"
          component={RenterHomeScreen}
          options={{ title: 'Renter Dashboard' }}
        />
        {/* Search Screen */}
        <Stack.Screen
          name="SearchScreen"
          component={SearchScreen}
          options={{ title: 'Search Screen' }}
        />
        {/* My Bookings Screen */}
        <Stack.Screen
          name="MyBookings"
          component={MyBookings}
          options={{ title: 'My Bookings Screen' }}
        />
        {/* Test Database Connection Screen */}
        <Stack.Screen
          name="TestDBConnection"
          component={TestDBConnection}
          options={{ title: 'Database Connection Test' }}
        />
        {/* Add other screens as needed */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}