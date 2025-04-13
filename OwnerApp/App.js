// OwnerApp/App.js
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import OwnerHomeScreen from './screens/OwnerHomeScreen';
import TestDBConnection from './screens/TestDBConnection';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Login Screen */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Owner Login' }}
        />
        {/* Home Screen */}
        <Stack.Screen
          name="OwnerHome"
          component={OwnerHomeScreen}
          options={{ title: 'Owner Dashboard' }}
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