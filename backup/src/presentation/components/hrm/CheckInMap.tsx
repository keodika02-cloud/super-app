import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, UrlTile, Circle, PROVIDER_DEFAULT } from 'react-native-maps';

interface Office {
    id: number;
    name: string;
    lat: number;
    long: number;
    radius: number;
}

interface Props {
    location: {
        latitude: number;
        longitude: number;
    } | null;
    offices?: Office[];
    loading?: boolean; // Keep explicit loading prop if used by parent, though logic below handles null location
}

// Parent passes 'loading' but user snippet didn't include it in destructuring or logic explicitly, 
// but the parent 'checkin.tsx' passes it: <CheckInMap location={location} loading={loadingLocation} offices={offices} />
// I will add it to interface to avoid TS errors, even if unused in this specific snippet logic (logic uses location check).
// Actually, looking at user snippet, they didn't include 'loading' in Props. 
// I should stick to user's snippet but add 'loading' to Props to prevent TS error in parent, or minimal change.
// Use user's snippet exactly as requested for logic, but ensure TS compatibility.
// User snippet: export const CheckInMap = ({ location, offices = [] }: Props) => { ... }
// Parent usage: <CheckInMap location={location} loading={loadingLocation} offices={offices} />
// Providing 'loading' in parent but not accepting in child is fine in JS/React runtime, but TS might complain if strict.
// However, I will strictly follow the "NỘI DUNG FILE CẦN GHI ĐÈ" which implies the content they WANT.
// I will paste the content provided, cleaning the URL.

export const CheckInMap = ({ location, offices = [] }: Props) => {
    // Default region (Vietnam center) if no location
    const defaultRegion = {
        latitude: 16.047079,
        longitude: 108.206230,
        latitudeDelta: 10,
        longitudeDelta: 10,
    };

    const currentRegion = location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005, // Zoom level gần (Street view)
        longitudeDelta: 0.005,
    } : defaultRegion;

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                region={currentRegion as any}
                mapType="none" // Quan trọng: Tắt map mặc định của Google/Apple để dùng UrlTile
                rotateEnabled={false}
                pitchEnabled={false}
            >
                {/* 1. Lớp bản đồ nền (CartoDB - Không bị chặn) */}
                <UrlTile
                    urlTemplate="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    maximumZ={19}
                    flipY={false}
                />

                {/* 2. Vẽ vùng Geofencing (Vòng tròn xanh) */}
                {offices.map((office) => (
                    <Circle
                        key={`zone-${office.id}`}
                        center={{ latitude: office.lat, longitude: office.long }}
                        radius={office.radius}
                        fillColor="rgba(37, 99, 235, 0.15)" // Blue loãng
                        strokeColor="rgba(37, 99, 235, 0.5)" // Viền Blue đậm
                        strokeWidth={1}
                    />
                ))}

                {/* 3. Marker vị trí văn phòng (Optional - giúp user dễ tìm) */}
                {offices.map((office) => (
                    <Marker
                        key={`marker-${office.id}`}
                        coordinate={{ latitude: office.lat, longitude: office.long }}
                        title={office.name}
                        description={`Bán kính: ${office.radius}m`}
                        opacity={0.8}
                    >
                        <View style={styles.officeMarker}>
                            <Text style={styles.officeText}>🏢</Text>
                        </View>
                    </Marker>
                ))}

                {/* 4. Vị trí người dùng */}
                {location && (
                    <Marker
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                        title="Vị trí của bạn"
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.userMarkerOuter}>
                            <View style={styles.userMarkerInner} />
                        </View>
                    </Marker>
                )}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    userMarkerOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(37, 99, 235, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fff',
    },
    userMarkerInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2563EB', // Blue-600
        borderWidth: 2,
        borderColor: '#fff',
    },
    officeMarker: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    officeText: {
        fontSize: 20,
    }
});
