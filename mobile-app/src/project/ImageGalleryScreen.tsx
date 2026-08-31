import React, { useState } from "react";
import { View, Text, Pressable, Image, FlatList, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { ProjectStackParamList } from "@/types";

type Rte = RouteProp<ProjectStackParamList, "ImageGallery">;

const { width } = Dimensions.get("window");

export function ImageGalleryScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const [activeIndex, setActiveIndex] = useState(params.startIndex ?? 0);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#000" }}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>
        <Text className="text-white font-medium">
          {activeIndex + 1} / {params.images.length}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={params.images}
        horizontal
        pagingEnabled
        initialScrollIndex={params.startIndex ?? 0}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          <View style={{ width, justifyContent: "center", alignItems: "center" }}>
            <Image source={{ uri: item }} style={{ width, height: "80%" }} resizeMode="contain" />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default ImageGalleryScreen;
