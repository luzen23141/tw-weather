import { Ionicons } from '@expo/vector-icons';
import * as ExpoLocation from 'expo-location';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Location } from '@/api/types';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { TAIWAN_CITIES } from '@/constants/taiwan-locations';
import { useMDColors } from '@/hooks/useMDColors';
import { useLocationsStore } from '@/store/locations.store';
import { getGlassStyle } from '@/utils/glass';
import { formatLocationDisplayName, formatLocationSecondaryName } from '@/utils/location-display';

/** 將 TAIWAN_CITIES 展平為可搜尋的列表 */
const SEARCHABLE: Array<Location & { label: string }> = TAIWAN_CITIES.flatMap((city) => [
  {
    label: city.name,
    name: city.name,
    country: '台灣',
    city: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
  },
  ...city.districts.map((d) => ({
    label: `${city.name} ${d.name}`,
    name: d.name,
    country: '台灣',
    city: city.name,
    district: d.name,
    township: d.name,
    latitude: d.latitude,
    longitude: d.longitude,
  })),
]);

const formatCoordinates = (location: Location): string =>
  `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;

const getLocationPrimaryText = (location: Location): string =>
  formatLocationDisplayName(location, 'township');

const getLocationSecondaryText = (location: Location): string => {
  const secondary = formatLocationSecondaryName(location, 'township');
  const coordinates = formatCoordinates(location);
  return secondary ? `${secondary} · ${coordinates}` : coordinates;
};

export default function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useMDColors();
  const { savedLocations, selectedLocation, addLocation, setSelectedLocation, removeLocation } =
    useLocationsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.trim().toLowerCase();
    return SEARCHABLE.filter(
      (loc) =>
        loc.label.toLowerCase().includes(q) ||
        loc.city?.toLowerCase().includes(q) ||
        loc.district?.toLowerCase().includes(q),
    ).slice(0, 30);
  }, [searchQuery, isSearching]);

  const isAlreadySaved = (loc: Location) =>
    savedLocations.some((s) => s.latitude === loc.latitude && s.longitude === loc.longitude);

  const handleAdd = (loc: Location) => {
    addLocation(loc);
    setSearchQuery('');
  };

  const handleSelect = (loc: Location) => {
    setSelectedLocation(loc);
  };

  const handleRemove = (loc: Location) => {
    removeLocation(`${loc.latitude},${loc.longitude}`);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      let status = 'granted';
      if (Platform.OS !== 'web') {
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        status = result.status;
      }

      if (status !== 'granted') {
        throw new Error('位置權限被拒絕');
      }

      const currentLocation = await Promise.race([
        ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('取得位置逾時，請確認是否允許存取定位')), 15000),
        ),
      ]);

      const { latitude, longitude } = currentLocation.coords;
      const reversedLocation = await ExpoLocation.reverseGeocodeAsync({ latitude, longitude });
      const placeName = reversedLocation[0];

      const newLoc: Location = {
        latitude,
        longitude,
        name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        ...(placeName?.country ? { country: placeName.country } : {}),
        ...(placeName?.city ? { city: placeName.city } : {}),
        ...(placeName?.district ? { district: placeName.district, township: placeName.district } : {}),
        ...(placeName?.street ? { neighborhood: placeName.street } : {}),
      };

      const saved = savedLocations.find((s) => s.name === newLoc.name);
      if (saved) {
        setSelectedLocation(saved);
      } else {
        addLocation(newLoc);
        setSelectedLocation(newLoc);
      }
      setSearchQuery('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知地理定位錯誤';
      const isPermissionDenied =
        errorMessage.toLowerCase().includes('denied') || errorMessage.includes('逾時');
      const finalMessage = isPermissionDenied ? '無法取得位置權限或定位逾時' : errorMessage;

      if (Platform.OS === 'web') {
        window.alert(`定位失敗：${finalMessage}`);
      } else {
        Alert.alert('定位失敗', finalMessage);
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <GlassBackground style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <BlurDecorative color="accent" size="lg" position="top-right" />
      <BlurDecorative color="tertiary" size="sm" position="bottom-left" />

      {/* 搜尋欄 */}
      <View className="px-4 py-3">
        <View
          className="bg-md-surface rounded-2xl h-11 items-center flex-row px-3 border border-glass-border shadow-glass"
          style={getGlassStyle(20)}
        >
          <Ionicons name="search-outline" size={16} color={colors.outline} />
          <TextInput
            className="text-md-on-surface ml-2 flex-1 text-sm"
            onChangeText={setSearchQuery}
            placeholder="搜尋城市或地區..."
            placeholderTextColor={colors.outline}
            value={searchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.outline} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!isSearching && (
        <TouchableOpacity
          className="flex-row items-center justify-center mx-4 mb-3 py-3 rounded-2xl bg-md-primary-container border border-glass-border"
          style={getGlassStyle(16)}
          onPress={handleGetCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
          ) : (
            <Ionicons
              name="navigate-outline"
              size={16}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className="text-md-primary font-semibold text-sm">
            {isGettingLocation ? '定位中...' : '使用當前位置'}
          </Text>
        </TouchableOpacity>
      )}

      {isSearching ? (
        searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.label}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 1, paddingBottom: 80 }}
            renderItem={({ item, index }) => {
              const saved = isAlreadySaved(item);
              const isFirst = index === 0;
              const isLast = index === searchResults.length - 1;
              return (
                <View
                  className={`px-4 py-3.5 bg-md-surface flex-row items-center justify-between ${
                    !isLast ? 'border-b border-glass-border' : ''
                  } ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''}`}
                  style={getGlassStyle(16)}
                >
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-md-on-surface">
                      {getLocationPrimaryText(item)}
                    </Text>
                    <Text className="text-xs text-md-on-surface-variant mt-0.5">
                      {getLocationSecondaryText(item)}
                    </Text>
                  </View>
                  {saved ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleAdd(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="search-outline" size={40} color={colors.outline} />
            <Text className="text-md-on-surface-variant mt-3 text-sm">未找到相符地點</Text>
          </View>
        )
      ) : savedLocations.length > 0 ? (
        <>
          <Text className="text-xs font-bold text-md-on-surface-variant uppercase tracking-wider px-4 mb-2">
            已儲存地點
          </Text>
          <FlatList
            data={savedLocations}
            keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 1, paddingBottom: 80 }}
            renderItem={({ item, index }) => {
              const isSelected =
                selectedLocation?.latitude === item.latitude &&
                selectedLocation?.longitude === item.longitude;
              const isFirst = index === 0;
              const isLast = index === savedLocations.length - 1;
              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  className={`px-4 py-3.5 flex-row items-center justify-between ${
                    isSelected
                      ? 'bg-md-primary-container border-glass-border-strong'
                      : 'bg-md-surface'
                  } ${!isLast ? 'border-b border-glass-border' : ''} ${
                    isFirst ? 'rounded-t-2xl' : ''
                  } ${isLast ? 'rounded-b-2xl' : ''}`}
                  style={getGlassStyle(16)}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-md-on-primary-container' : 'text-md-on-surface'
                      }`}
                    >
                      {getLocationPrimaryText(item)}
                    </Text>
                    <Text className="text-xs text-md-on-surface-variant mt-0.5">
                      {getLocationSecondaryText(item)}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                    <TouchableOpacity
                      onPress={() => handleRemove(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <View
            className="bg-md-surface rounded-3xl p-8 items-center gap-3 border border-glass-border w-full"
            style={getGlassStyle(20)}
          >
            <Ionicons name="location-outline" size={48} color={colors.outline} />
            <Text className="text-md-on-surface text-base font-bold text-center">尚無收藏地點</Text>
            <Text className="text-md-on-surface-variant text-center text-sm leading-5">
              在上方搜尋欄輸入城市或地區名稱即可新增收藏
            </Text>
          </View>
        </View>
      )}
    </GlassBackground>
  );
}
