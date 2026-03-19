import * as ExpoLocation from 'expo-location';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';

import type { Location } from '@/api/types';
import { AppIcon } from '@/components/icons/AppIcon';
import { BlurDecorative } from '@/components/ui/BlurDecorative';
import { Button } from '@/components/ui/Button';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { PageHeaderCard } from '@/components/ui/PageHeaderCard';
import { PageState } from '@/components/ui/PageState';
import { TextField } from '@/components/ui/TextField';
import { TAIWAN_CITIES } from '@/constants/taiwan-locations';
import { useMDColors } from '@/hooks/useMDColors';
import { useLocationsStore } from '@/store/locations.store';
import { getGlassStyle } from '@/components/ui/glass';
import { formatLocationDisplayName, formatLocationSecondaryName } from '@/utils/location-display';
import { resolveTaiwanLocation } from '@/utils/location-resolver';

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

const getLocationPrimaryText = (location: Location): string => formatLocationDisplayName(location);

const getLocationSecondaryText = (location: Location): string => {
  const secondary = formatLocationSecondaryName(location);
  const coordinates = formatCoordinates(location);
  return secondary ? `${secondary} · ${coordinates}` : coordinates;
};

export default function LocationsScreen() {
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
      const newLoc = resolveTaiwanLocation(latitude, longitude);

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
    <GlassBackground className="pt-2">
      <BlurDecorative color="accent" size="lg" position="top-right" opacity={0.08} />
      <BlurDecorative color="tertiary" size="sm" position="bottom-left" opacity={0.06} />

      <FlatList
        data={isSearching ? searchResults : savedLocations}
        keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
        contentContainerStyle={{ paddingBottom: 104, gap: 12 }}
        style={
          Platform.OS === 'web' ? { alignSelf: 'center', width: '100%', maxWidth: 920 } : undefined
        }
        ListHeaderComponent={
          <View className="gap-5 pb-3">
            <PageHeaderCard
              icon="location-outline"
              title="地點管理"
              subtitle="搜尋並切換常用地點。"
            />

            <View className="px-4">
              <TextField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="搜尋城市或地區..."
                accessibilityLabel="搜尋城市或地區"
                className="w-full"
              />
            </View>

            {!isSearching ? (
              <View className="px-4">
                <Button
                  variant="tonal"
                  label="使用當前位置"
                  loading={isGettingLocation}
                  icon={<AppIcon name="navigate-outline" size={16} color={colors.primary} />}
                  onPress={() => {
                    void handleGetCurrentLocation();
                  }}
                />
              </View>
            ) : null}

            {!isSearching ? (
              savedLocations.length > 0 ? (
                <Text className="mb-2 px-4 text-[11px] font-bold uppercase tracking-[1.2px] text-md-on-surface-variant">
                  已儲存地點
                </Text>
              ) : null
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => {
          if (isSearching) {
            const saved = isAlreadySaved(item);
            const isFirst = index === 0;
            const isLast = index === searchResults.length - 1;

            return (
              <View
                className={`mx-4 flex-row items-center justify-between rounded-[26px] border border-glass-border-strong bg-md-surface-container px-4 py-3 ${
                  !isLast ? 'border-b border-glass-border' : ''
                } ${isFirst ? 'rounded-t-[26px]' : ''} ${isLast ? 'rounded-b-[26px]' : ''}`}
                style={getGlassStyle(16)}
              >
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-md-on-surface">
                    {getLocationPrimaryText(item)}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-md-on-surface-variant">
                    {getLocationSecondaryText(item)}
                  </Text>
                </View>
                {saved ? (
                  <AppIcon name="checkmark-circle" size={22} color={colors.primary} />
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`新增 ${getLocationPrimaryText(item)} 到收藏`}
                    onPress={() => handleAdd(item)}
                    className="min-h-11 min-w-11 items-center justify-center rounded-full"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <AppIcon name="add-circle-outline" size={24} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            );
          }

          const isSelected =
            selectedLocation?.latitude === item.latitude &&
            selectedLocation?.longitude === item.longitude;
          const isFirst = index === 0;
          const isLast = index === savedLocations.length - 1;

          return (
            <View
              className={`mx-4 flex-row items-center gap-3 rounded-[26px] border px-4 py-3 ${
                isSelected
                  ? 'border-glass-border-strong bg-md-primary-container'
                  : 'border-glass-border-strong bg-md-surface-container'
              } ${!isLast ? 'border-b border-glass-border' : ''} ${isFirst ? 'rounded-t-[26px]' : ''} ${
                isLast ? 'rounded-b-[26px]' : ''
              }`}
              style={getGlassStyle(16)}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`選擇 ${getLocationPrimaryText(item)}`}
                onPress={() => handleSelect(item)}
                className="flex-1"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] font-semibold ${
                        isSelected ? 'text-md-on-primary-container' : 'text-md-on-surface'
                      }`}
                    >
                      {getLocationPrimaryText(item)}
                    </Text>
                    <Text className="mt-0.5 text-[12px] text-md-on-surface-variant">
                      {getLocationSecondaryText(item)}
                    </Text>
                  </View>
                  {isSelected ? (
                    <AppIcon name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
                </View>
              </TouchableOpacity>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`刪除 ${getLocationPrimaryText(item)}`}
                onPress={() => handleRemove(item)}
                className="min-h-11 min-w-11 items-center justify-center rounded-full"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          );
        }}
        ItemSeparatorComponent={undefined}
        ListEmptyComponent={
          isSearching ? (
            <PageState type="empty" title="未找到相符地點" description="請嘗試其他關鍵字。" />
          ) : (
            <PageState
              type="empty"
              title="尚無收藏地點"
              description="在上方搜尋欄輸入城市或地區名稱即可新增收藏。"
            />
          )
        }
      />
    </GlassBackground>
  );
}
