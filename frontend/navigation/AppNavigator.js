import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen    from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ScannerScreen  from '../screens/ScannerScreen';
import ResultScreen   from '../screens/ResultScreen';
import HistoryScreen  from '../screens/HistoryScreen';
import LanguageScreen from '../screens/LanguageScreen';

import { useLanguage } from '../context/LanguageContext';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const C = {
  forest:    '#1B4332',
  forestMid: '#2D6A4F',
  textLight: '#7A9E7E',
  cream:     '#FDF8EE',
  creamDark: '#F0E6CE',
  white:     '#FFFFFF',
};

// ── Custom tab bar ────────────────────────────────────────────────────────────
function CustomTabBar({ state, descriptors, navigation }) {
  const { t } = useLanguage();

  const TABS = [
    { key: 'Dashboard', icon: '🏠', label: t.home },
    { key: 'Scanner',   icon: '🔬', label: t.scan },
    { key: 'History',   icon: '📋', label: t.hist },
    { key: 'Language',  icon: '🌐', label: t.lang },
  ];

  return (
    <View style={tabStyles.tabBar}>
      {state.routes.map((route, index) => {
        const tab      = TABS[index] || TABS[0];
        const isActive = state.index === index;

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tabItem}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <Text style={tabStyles.tabIcon}>{tab.icon}</Text>
            <Text style={[tabStyles.tabLabel, isActive && tabStyles.tabLabelActive]}>
              {tab.label}
            </Text>
            {isActive && <View style={tabStyles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main tab navigator ────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scanner"   component={ScannerScreen}   />
      <Tab.Screen name="History"   component={HistoryScreen}   />
      <Tab.Screen name="Language"  component={LanguageScreen}  />
    </Tab.Navigator>
  );
}

// ── Root stack ────────────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {/* Auth screens */}
        <Stack.Screen name="Login"    component={LoginScreen}    />
        <Stack.Screen name="Register" component={RegisterScreen} />

        {/* Main app */}
        <Stack.Screen name="Main"   component={MainTabs}     />
        <Stack.Screen name="Result" component={ResultScreen} options={{ animation: 'slide_from_bottom' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderTopColor: C.creamDark,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 10, fontWeight: '500', color: C.textLight },
  tabLabelActive: { color: C.forestMid, fontWeight: '700' },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.forestMid,
    marginTop: 2,
  },
});
