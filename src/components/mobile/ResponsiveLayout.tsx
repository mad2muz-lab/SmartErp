import React from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';

// Import screens (we'll create these later)
import DashboardScreen from '../../screens/mobile/DashboardScreen';
import CustomerListScreen from '../../screens/mobile/CustomerListScreen';
import LeadListScreen from '../../screens/mobile/LeadListScreen';
import InventoryListScreen from '../../screens/mobile/InventoryListScreen';
import QuotationListScreen from '../../screens/mobile/QuotationListScreen';
import SettingsScreen from '../../screens/mobile/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

// Bottom Tab Navigator for main navigation
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3182ce',
        tabBarInactiveTintColor: '#718096',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#2d3748',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          // Add icons later
        }}
      />
      <Tab.Screen 
        name="Customers" 
        component={CustomerListScreen}
        options={{
          tabBarLabel: 'Customers',
        }}
      />
      <Tab.Screen 
        name="Leads" 
        component={LeadListScreen}
        options={{
          tabBarLabel: 'Leads',
        }}
      />
      <Tab.Screen 
        name="Inventory" 
        component={InventoryListScreen}
        options={{
          tabBarLabel: 'Inventory',
        }}
      />
      <Tab.Screen 
        name="Quotations" 
        component={QuotationListScreen}
        options={{
          tabBarLabel: 'Quotes',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator for nested navigation
const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      {/* Add more stack screens here */}
    </Stack.Navigator>
  );
};

// Drawer Navigator for side menu
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3182ce',
        },
        headerTintColor: '#ffffff',
        drawerActiveTintColor: '#3182ce',
        drawerInactiveTintColor: '#718096',
      }}
    >
      <Drawer.Screen 
        name="MainStack" 
        component={StackNavigator}
        options={{ 
          title: 'Trading ERP',
          headerShown: false 
        }}
      />
    </Drawer.Navigator>
  );
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7fafc' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default ResponsiveLayout;
