import React from "react";
import { View, Text, Pressable } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "@/components/ui";
import type { ProjectStackParamList } from "@/types";

type Rte = RouteProp<ProjectStackParamList, "VideoPreview">;

function formatSeconds(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function VideoPreviewScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rte>();
  const player = useVideoPlayer(params.videoUrl, (videoPlayer) => {
    videoPlayer.timeUpdateEventInterval = 0.5;
  });
  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });
  const timeUpdate = useEvent(player, "timeUpdate");
  const currentTime = timeUpdate?.currentTime ?? player.currentTime;
  const duration = player.duration || 0;

  return (
    <Screen>
      <View className="flex-row items-center px-6 py-3">
        <Pressable onPress={() => navigation.goBack()} className="mr-3">
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{params.title}</Text>
      </View>
      <View style={{ width: "100%", height: 220, backgroundColor: "#000" }}>
        <VideoView player={player} style={{ width: "100%", height: "100%" }} contentFit="contain" nativeControls={false} />
        <Pressable onPress={() => (isPlaying ? player.pause() : player.play())} className="absolute inset-0 items-center justify-center">
          {!isPlaying && <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.9)" />}
        </Pressable>
        <View className="absolute bottom-2 right-3">
          <Text className="text-white text-xs">{formatSeconds(currentTime)} / {formatSeconds(duration)}</Text>
        </View>
      </View>
      <View className="px-6 pt-5">
        <Text className="font-bold text-gray-900 mb-1">Project Overview</Text>
        <Text className="text-gray-500 text-sm mb-5">
          Watch the complete overview of this project and its features.
        </Text>

        <Text className="font-bold text-gray-900 mb-3">More Videos</Text>
        {MORE_VIDEOS.map((video) => (
          <View key={video.label} className="flex-row items-center py-3 border-b border-gray-100">
            <View className="w-11 h-11 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: "#EEF0FF" }}>
              <Ionicons name="play" size={16} color="#4F39F6" />
            </View>
            <Text className="flex-1 text-gray-900 font-medium">{video.label}</Text>
            <Text className="text-gray-400 text-xs">{video.duration}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const MORE_VIDEOS = [
  { label: "Installation Guide", duration: "03:45" },
  { label: "Features Walkthrough", duration: "05:12" },
  { label: "Admin Panel Demo", duration: "04:30" },
];

export default VideoPreviewScreen;
