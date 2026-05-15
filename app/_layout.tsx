import { Stack } from 'expo-router';
import { SafeAreaProvider,SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
     <SafeAreaView style={{ flex: 1, backgroundColor: '#E5E5E5' }}>
     <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen
        name="(tabs)"
        
      />
    </Stack>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}