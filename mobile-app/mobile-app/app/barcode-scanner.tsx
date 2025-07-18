// app/barcode-scanner.tsx
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { Camera, CameraView } from "expo-camera"; // <-- Correct import
import { router, Stack } from 'expo-router';
import { getProductByBarcode } from '@/src/api/client';

export default function BarcodeScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const product = await getProductByBarcode(data);
      if (product && product.id) {
        const listingData = { product_id: product.id, product_name: product.name };
        Alert.alert( 'Product Found!', `${product.name}`,
            [
                { text: 'Scan Again', onPress: () => setScanned(false), style: 'cancel' },
                { text: 'View Product', onPress: () => router.replace(`/product/${product.id}?listingData=${JSON.stringify(listingData)}`) }
            ]
        );
      }
    } catch (error) {
      Alert.alert( 'Product Not Found', `No product with barcode ${data} was found.`,
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );
    }
  };

  if (hasPermission === null) {
    return <View style={styles.permissionContainer}><Text style={{color: 'white'}}>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return (
        <View style={styles.permissionContainer}>
            <Text style={{color: 'white'}}>No access to camera</Text>
            <Button title="Go Back" onPress={() => router.back()} />
        </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Use the correct CameraView component */}
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "qr"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <Stack.Screen options={{ title: 'Scan Product Barcode' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});