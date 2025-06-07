import { useTheme } from "@react-navigation/native";
import { Image, ImageBackground } from "expo-image";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  LinearTransition,
  runOnJS,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Notification = {
  id: string;
  icon: any;
  title: string;
  subtitle?: string;
  avatar?: string;
  time: string;
};

const notifications = [
  {
    id: "1",
    icon: require("../assets/images/icon.png"), // Replace with your own icon or use a placeholder
    title: "Reminder",
    subtitle: "Re: Invitation: Join Nothing in Lo...",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    time: "3h",
  },
  {
    id: "2",
    icon: require("../assets/images/icon.png"),
    title: "Just a reminder to step on the sca...",
    subtitle: "",
    time: "3h",
  },
  {
    id: "3",
    icon: require("../assets/images/icon.png"),
    title: "Threads",
    subtitle: "33 fediverse users liked your carousel",
    time: "5h",
  },
  {
    id: "4",
    icon: require("../assets/images/icon.png"),
    title: "Upcoming live concert",
    subtitle: "deadmau5 performing on Sat, A...",
    time: "20h",
  },
  {
    id: "5",
    icon: require("../assets/images/icon.png"),
    title: "2025 Empire",
    subtitle: "Sam Alston: Shared a photo",
    time: "21h",
  },
  {
    id: "6",
    icon: require("../assets/images/icon.png"),
    title: "Messenger",
    subtitle: "You received a message",
    time: "1d",
  },
  {
    id: "7",
    icon: require("../assets/images/icon.png"),
    title: "parmesanpapi17",
    subtitle: "End of an era 😔",
    time: "1d",
  },
  {
    id: "8",
    icon: require("../assets/images/icon.png"),
    title: "#social",
    subtitle: "F1 is up there for most...",
    time: "2d",
  },
  {
    id: "9",
    icon: require("../assets/images/icon.png"),
    title: "Reduce screen timeout",
    subtitle: "Long screen timeout consumes battery...",
    time: "3d",
  },
];

const SCREEN_WIDTH = Dimensions.get("window").width;

const NotificationCard = ({
  item,
  isPanning,
  onItemDelete,
}: {
  item: Notification;
  isPanning: SharedValue<boolean>;
  onItemDelete: (id: string) => void;
}) => {
  const theme = useTheme();
  const offsetX = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastTime = useSharedValue(0);
  const velocity = useSharedValue(0);

  useDerivedValue(() => {
    if (Math.abs(offsetX.value) > SCREEN_WIDTH / 2) {
      offsetX.value = withSpring(2 * offsetX.value);
    }
    if (Math.abs(offsetX.value) > SCREEN_WIDTH) {
      runOnJS(onItemDelete)(item.id);
    }
  });

  const panGesture = Gesture.Manual()
    .onTouchesDown((e) => {
      const x = e.changedTouches[0]?.absoluteX;
      const y = e.changedTouches[0]?.absoluteY;
      if (x != null && y != null) {
        startX.value = x;
        startY.value = y;
        lastX.value = x;
        lastTime.value = Date.now();
      }
    })
    .onTouchesMove((e, manager) => {
      const x = e.changedTouches[0]?.absoluteX;
      const y = e.changedTouches[0]?.absoluteY;
      if (x != null && y != null) {
        const deltaX = x - startX.value;
        const deltaY = y - startY.value;
        const currentTime = Date.now();
        const timeDelta = currentTime - lastTime.value;

        // Calculate velocity (pixels per millisecond)
        if (timeDelta > 0) {
          velocity.value = (x - lastX.value) / timeDelta;
        }

        lastX.value = x;
        lastTime.value = currentTime;

        if (Math.abs(deltaX) > 5 && Math.abs(deltaY) < 5) {
          isPanning.value = true;
          manager.activate();
        }
        offsetX.value = deltaX;
      }
    })
    .onTouchesUp((e, manager) => {
      // Convert velocity to pixels per second for withDecay
      const velocityInPixelsPerSecond = velocity.value * 1000;
      if (Math.abs(velocityInPixelsPerSecond) > 1000) {
        offsetX.value = withDecay({
          velocity: velocityInPixelsPerSecond,
          deceleration: 0.998,
        });
      } else {
        offsetX.value = withSpring(0);
      }
      isPanning.value = false;
      manager.end();
    })
    .onTouchesCancelled((e, manager) => {
      offsetX.value = withSpring(0);
      isPanning.value = false;
      manager.end();
    });
  const animatedItemStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offsetX.value }],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          animatedItemStyle,
          { backgroundColor: theme.colors.card, borderRadius: 6 },
        ]}
      >
        <Image source={item.icon} style={styles.icon} />
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {!!item.subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.text, opacity: 0.5 },
              ]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          )}
        </View>
        <Text style={[styles.time, { color: theme.colors.text, opacity: 0.5 }]}>
          {item.time}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
};

export default function Index() {
  const theme = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const isPanning = useSharedValue(false);
  const [data, setData] = useState(notifications);

  const animatedProps = useAnimatedProps(() => {
    return {
      scrollEnabled: !isPanning.value,
    };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={require("../assets/images/bg.jpg")}
        style={{ flex: 1 }}
        blurRadius={800}
        contentFit="cover"
      >
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: theme.colors.background, opacity: 0.5 },
          ]}
        />
        <Animated.FlatList
          itemLayoutAnimation={LinearTransition.springify()}
          animatedProps={animatedProps}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              isPanning={isPanning}
              onItemDelete={(id) => {
                console.log("delete");
                setData(data.filter((item) => item.id !== id));
              }}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 3,
            paddingTop: top,
            paddingBottom: bottom,
          }}
          showsVerticalScrollIndicator={false}
        />
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  silentSection: {
    marginTop: 16,
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
  },
  silentText: {
    fontWeight: "500",
    fontSize: 15,
  },
});
