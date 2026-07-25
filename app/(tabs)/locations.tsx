import * as ExpoLocation from 'expo-location';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, Text, View } from 'react-native';

import type { Location } from '@/api/types';
import { AppIcon } from '@/components/icons/AppIcon';
import { Button } from '@/components/ui/Button';
import { GlassBackground } from '@/components/ui/GlassBackground';
import { LocationRow } from '@/components/ui/LocationRow';
import { PageState } from '@/components/ui/PageState';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { TextField } from '@/components/ui/TextField';
import { TAIWAN_CITIES } from '@/constants/taiwan-locations';
import { useMDColors } from '@/hooks/useMDColors';
import {
  getCurrentLocationWithTimeout,
  getLocationFallback,
  getWebGeolocationPermissionState,
  isWebGeolocationSupported,
} from '@/hooks/useLocation';
import { useLocationsStore } from '@/store/locations.store';
import { getPressFeedbackStyle } from '@/components/ui/press-feedback';
import { formatLocationDisplayName, formatLocationSecondaryName } from '@/utils/location-display';
import { isSameLocation } from '@/utils/location-dedupe';
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
  const [locationActionMessage, setLocationActionMessage] = useState<string | null>(null);

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

  /*
    判準必須與 store 的 addLocation 一致。

    先前這裡用浮點座標精確相等，store 用 isSameLocation（行政區優先、座標
    500m 內視為同一點）。兩套判準不一致的後果是「＋」按下去沒反應：UI 依浮
    點比對認定未收藏所以顯示「＋」，store 依行政區比對認定重複而拒絕寫入。
    GPS 定位加入的板橋與搜尋加入的板橋座標永遠不會精確相同，所以這不是邊角
    案例，是通勤族加入第二個地點時的預設路徑。
  */
  const isAlreadySaved = (loc: Location) => savedLocations.some((s) => isSameLocation(s, loc));

  const handleAdd = (loc: Location) => {
    addLocation(loc);
    setSearchQuery('');
  };

  /**
   * 搜尋結果被點選 —— 收藏並立即切換過去。
   *
   * 點一筆搜尋結果的意圖是「我要看這裡的天氣」，不是「請記住這個地名」。
   * 先前這一列完全沒有 onPress，LocationRow 因此連 Pressable 都不包，整列
   * 是死的；使用者得找到右側那顆「＋」，加完還要再點一次才會真的切換。
   * 「＋」保留給「只收藏、不切換」，適合一次加好幾個地點。
   */
  const handleSelectSearchResult = (loc: Location) => {
    addLocation(loc);
    setSelectedLocation(loc);
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
      setLocationActionMessage(null);

      let status = 'granted';
      if (Platform.OS !== 'web') {
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        status = result.status;
      } else {
        if (!isWebGeolocationSupported()) {
          throw new Error('此瀏覽器不支援定位功能');
        }

        const permissionState = await getWebGeolocationPermissionState();
        if (permissionState === 'denied') {
          throw new Error('瀏覽器已封鎖定位權限，請於網站權限設定中允許定位');
        }
      }

      if (status !== 'granted') {
        throw new Error('位置權限被拒絕');
      }

      const currentLocation = await getCurrentLocationWithTimeout();

      const { latitude, longitude } = currentLocation.coords;
      const newLoc = resolveTaiwanLocation(latitude, longitude);

      const saved = savedLocations.find((s) => s.name === newLoc.name);
      if (saved) {
        setSelectedLocation(saved);
        setLocationActionMessage(`已切換為目前位置：${getLocationPrimaryText(saved)}`);
      } else {
        addLocation(newLoc);
        setSelectedLocation(newLoc);
        setLocationActionMessage(`已新增並切換為目前位置：${getLocationPrimaryText(newLoc)}`);
      }
      setSearchQuery('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知地理定位錯誤';
      const isPermissionDenied =
        errorMessage.toLowerCase().includes('denied') || errorMessage.includes('逾時');
      const finalMessage = isPermissionDenied ? '無法取得位置權限或定位逾時' : errorMessage;

      const fallbackLocation = getLocationFallback(selectedLocation, savedLocations);

      if (fallbackLocation) {
        setSelectedLocation(fallbackLocation);
        setLocationActionMessage(
          `定位失敗，已改用已儲存地點：${getLocationPrimaryText(fallbackLocation)}`,
        );
      } else {
        setLocationActionMessage(`定位失敗：${finalMessage}`);
      }

      if (Platform.OS === 'web' && !fallbackLocation) {
        window.alert(`定位失敗：${finalMessage}`);
      } else if (!fallbackLocation) {
        Alert.alert('定位失敗', finalMessage);
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <GlassBackground className="pt-2">
      <FlatList
        data={isSearching ? searchResults : savedLocations}
        keyExtractor={(item) => `${item.latitude}-${item.longitude}`}
        contentContainerStyle={{ paddingBottom: 104 }}
        style={
          Platform.OS === 'web' ? { alignSelf: 'center', width: '100%', maxWidth: 920 } : undefined
        }
        ListHeaderComponent={
          <View className="gap-4 pb-2">
            <View className="px-4 pt-2">
              <TextField
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="搜尋城市或地區..."
                accessibilityLabel="搜尋城市或地區"
                className="w-full"
              />
            </View>

            {!isSearching ? (
              <View className="gap-2 px-4">
                <Button
                  variant="tonal"
                  label="使用當前位置"
                  loading={isGettingLocation}
                  icon={<AppIcon name="navigate-outline" size={16} color={colors.primary} />}
                  onPress={() => {
                    void handleGetCurrentLocation();
                  }}
                />
                {locationActionMessage ? (
                  <Text className="text-[12px] leading-5 text-md-on-surface-variant">
                    {locationActionMessage}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <SectionLabel>{isSearching ? '搜尋結果' : '已儲存地點'}</SectionLabel>
          </View>
        }
        renderItem={({ item, index }) => {
          const isLast = index === (isSearching ? searchResults.length : savedLocations.length) - 1;

          if (isSearching) {
            const saved = isAlreadySaved(item);

            return (
              <LocationRow
                primary={getLocationPrimaryText(item)}
                secondary={getLocationSecondaryText(item)}
                isLast={isLast}
                onPress={() => handleSelectSearchResult(item)}
                accessibilityLabel={`查看 ${getLocationPrimaryText(item)} 的天氣`}
                trailing={
                  saved ? (
                    <View className="h-11 w-11 items-center justify-center">
                      <AppIcon name="checkmark-circle" size={20} color={colors.primary} />
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`新增 ${getLocationPrimaryText(item)} 到收藏`}
                      onPress={() => handleAdd(item)}
                      className="h-11 w-11 items-center justify-center rounded-full"
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={(state) =>
                        getPressFeedbackStyle(state, { pressedOpacity: 0.84, pressedScale: 0.97 })
                      }
                    >
                      <AppIcon name="add-circle-outline" size={22} color={colors.primary} />
                    </Pressable>
                  )
                }
              />
            );
          }

          const isSelected =
            selectedLocation?.latitude === item.latitude &&
            selectedLocation?.longitude === item.longitude;

          return (
            <LocationRow
              primary={getLocationPrimaryText(item)}
              secondary={getLocationSecondaryText(item)}
              isLast={isLast}
              isSelected={isSelected}
              onPress={() => handleSelect(item)}
              accessibilityLabel={`選擇 ${getLocationPrimaryText(item)}`}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`刪除 ${getLocationPrimaryText(item)}`}
                  onPress={() => handleRemove(item)}
                  className="h-11 w-11 items-center justify-center rounded-full"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={(state) =>
                    getPressFeedbackStyle(state, { pressedOpacity: 0.84, pressedScale: 0.97 })
                  }
                >
                  <AppIcon name="trash-outline" size={18} color={colors.error} />
                </Pressable>
              }
            />
          );
        }}
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
