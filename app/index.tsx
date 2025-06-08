import { Notification, notifications } from "@/mock/data";
import { useTheme } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Image, ImageBackground } from "expo-image";
import React, { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
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

const SCREEN_WIDTH = Dimensions.get("window").width;

interface NotificationCardProps {
  item: Notification;
  isPanning: SharedValue<boolean>;
  onItemDelete: (id: string) => void;
  adjacentOffset?: SharedValue<number>;
  index: number;
  activeIndex: SharedValue<number>;
  firstItem: boolean;
  lastItem: boolean;
}

const NotificationCard = (props: NotificationCardProps) => {
  const {
    item,
    isPanning,
    onItemDelete,
    adjacentOffset,
    index,
    activeIndex,
    firstItem,
    lastItem,
  } = props;
  const theme = useTheme();
  const offsetX = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastX = useSharedValue(0);
  const lastTime = useSharedValue(0);
  const velocity = useSharedValue(0);
  const adjacentTension = useSharedValue(false);
  const prevTension = useSharedValue(false);
  const minBorderRadius = 6;

  const isAdjacent = useDerivedValue(() => {
    return Math.abs(activeIndex.get() - index) === 1;
  });

  const isPrevious = useDerivedValue(() => {
    return index < activeIndex.get();
  });

  useDerivedValue(() => {
    const currentTension = adjacentTension.get();
    if (prevTension.get() && !currentTension) {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
    prevTension.set(currentTension);
  });

  useDerivedValue(() => {
    if (!isPanning.get()) {
      if (Math.abs(offsetX.get()) > SCREEN_WIDTH * 0.1) {
        offsetX.set(
          withSpring(2 * offsetX.get(), {
            mass: 1,
            damping: 25,
            stiffness: 500,
            overshootClamping: false,
            restDisplacementThreshold: 0.001,
            restSpeedThreshold: 0.001,
          })
        );
      }
    }
    if (Math.abs(offsetX.get()) > SCREEN_WIDTH) {
      runOnJS(onItemDelete)(item.id);
    }
  });

  const panGesture = Gesture.Manual()
    .onTouchesDown((e) => {
      const x = e.changedTouches[0]?.absoluteX;
      const y = e.changedTouches[0]?.absoluteY;
      adjacentTension.set(true);
      if (x != null && y != null) {
        startX.set(x);
        startY.set(y);
        lastX.set(x);
        lastTime.set(Date.now());
        activeIndex.set(index);
      }
    })
    .onTouchesMove((e, manager) => {
      const x = e.changedTouches[0]?.absoluteX;
      const y = e.changedTouches[0]?.absoluteY;
      if (x != null && y != null) {
        const deltaX = x - startX.get();
        const deltaY = y - startY.get();
        const currentTime = Date.now();
        const timeDelta = currentTime - lastTime.get();
        const heavyDelta = deltaX * 0.92;

        // Calculate velocity (pixels per millisecond)
        if (timeDelta > 0) {
          velocity.set((x - lastX.get()) / timeDelta);
        }

        lastX.set(x);
        lastTime.set(currentTime);

        if (Math.abs(heavyDelta) > 5 && Math.abs(deltaY) < 5) {
          isPanning.set(true);
          manager.activate();
        }
        offsetX.set(
          Math.abs(heavyDelta) < SCREEN_WIDTH * 0.1 ? heavyDelta : deltaX
        );
        if (adjacentOffset) {
          if (
            Math.abs(heavyDelta) < SCREEN_WIDTH * 0.1 &&
            adjacentTension.get()
          ) {
            adjacentOffset.set(heavyDelta * 0.3);
          } else {
            adjacentOffset.set(
              withSpring(
                0,
                {
                  mass: 1,
                  damping: 25,
                  stiffness: 500,
                  overshootClamping: false,
                  restDisplacementThreshold: 0.001,
                  restSpeedThreshold: 0.001,
                },
                () => {
                  if (adjacentTension.get()) {
                    adjacentTension.set(false);
                  }
                }
              )
            );
          }
        }
      }
    })
    .onTouchesUp((e, manager) => {
      // Convert velocity to pixels per second for withDecay
      const velocityInPixelsPerSecond = velocity.get() * 1000;
      if (Math.abs(velocityInPixelsPerSecond) > 1000) {
        offsetX.set(
          withDecay({
            velocity: velocityInPixelsPerSecond,
            deceleration: 0.998,
          })
        );
      } else {
        offsetX.set(
          withSpring(0, {
            mass: 1,
            damping: 25,
            stiffness: 500,
            overshootClamping: false,
            restDisplacementThreshold: 0.001,
            restSpeedThreshold: 0.001,
          })
        );
        if (adjacentOffset) {
          adjacentOffset.set(
            withSpring(0, {
              mass: 1,
              damping: 25,
              stiffness: 500,
              overshootClamping: false,
              restDisplacementThreshold: 0.001,
              restSpeedThreshold: 0.001,
            })
          );
        }
      }
      isPanning.set(false);
      manager.end();
    })
    .onTouchesCancelled((e, manager) => {
      offsetX.set(withSpring(0));
      if (adjacentOffset) {
        adjacentOffset.set(withSpring(0));
      }
      isPanning.set(false);
      manager.end();
    });

  const animatedItemStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.get() === index;
    const isAdjacentToActive = isAdjacent.get();
    const isPrev = isPrevious.get();

    if (!isActive && !isAdjacentToActive) {
      return {
        transform: [{ translateX: 0 }],
        ...(firstItem && {
          borderTopLeftRadius: 40,
          borderTopRightRadius: 40,
        }),
        ...(lastItem && {
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }),
      };
    }

    if (isActive) {
      const border = interpolate(
        offsetX.get(),
        [-SCREEN_WIDTH * 0.1, 0, SCREEN_WIDTH * 0.1],
        [20, minBorderRadius, 20],
        Extrapolation.CLAMP
      );
      return {
        transform: [{ translateX: offsetX.get() }],
        borderRadius: border,
        borderTopLeftRadius: border,
        borderTopRightRadius: border,
        borderBottomLeftRadius: border,
        borderBottomRightRadius: border,
      };
    }

    if (isAdjacentToActive) {
      const offset = adjacentOffset?.get() || 0;
      const absOffset = Math.abs(offset);

      return {
        transform: [{ translateX: offset }],
        ...(offset > 0
          ? isPrev
            ? {
                borderBottomLeftRadius: interpolate(
                  absOffset,
                  [0, SCREEN_WIDTH * 0.1],
                  [minBorderRadius, 100]
                ),
              }
            : {
                borderTopLeftRadius: interpolate(
                  absOffset,
                  [0, SCREEN_WIDTH * 0.1],
                  [minBorderRadius, 100]
                ),
              }
          : isPrev
          ? {
              borderBottomRightRadius: interpolate(
                absOffset,
                [0, SCREEN_WIDTH * 0.1],
                [minBorderRadius, 100]
              ),
            }
          : {
              borderTopRightRadius: interpolate(
                absOffset,
                [0, SCREEN_WIDTH * 0.1],
                [minBorderRadius, 100]
              ),
            }),
      };
    }

    return {
      transform: [{ translateX: adjacentOffset?.get() || 0 }],
    };
  }, [
    activeIndex,
    adjacentOffset,
    firstItem,
    index,
    lastItem,
    offsetX,
    isAdjacent,
    isPrevious,
  ]);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.card,
          animatedItemStyle,
          {
            borderRadius: minBorderRadius,
          },
          firstItem && {
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
          },
          lastItem && {
            borderBottomLeftRadius: 40,
            borderBottomRightRadius: 40,
          },
        ]}
      >
        <BlurView
          intensity={100}
          tint={"systemChromeMaterial"}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
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
                { color: theme.colors.text, opacity: 0.8 },
              ]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          )}
        </View>
        <Text style={[styles.time, { color: theme.colors.text, opacity: 0.8 }]}>
          {item.time}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
};

export default function Index() {
  const theme = useTheme();
  const { top, bottom } = useSafeAreaInsets();
  const [data, setData] = useState<Notification[]>(notifications);
  const isPanning = useSharedValue(false);
  const adjacentOffset = useSharedValue(0);
  const activeIndex = useSharedValue(-1);

  const animatedProps = useAnimatedProps(() => {
    return {
      scrollEnabled: !isPanning.get(),
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
            { backgroundColor: theme.colors.background, opacity: 0.1 },
          ]}
        />
        <Animated.FlatList
          itemLayoutAnimation={LinearTransition.springify()
            .mass(1)
            .damping(25)
            .stiffness(200)}
          animatedProps={animatedProps}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <NotificationCard
              item={item}
              isPanning={isPanning}
              onItemDelete={(id) => {
                setData(data.filter((item) => item.id !== id));
              }}
              adjacentOffset={adjacentOffset}
              isAdjacent={Math.abs(activeIndex.get() - index) === 1}
              isPrevious={index < activeIndex.get()}
              index={index}
              activeIndex={activeIndex}
              firstItem={index === 0}
              lastItem={index === data.length - 1}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 3,
            paddingTop: top + 20,
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
    overflow: "hidden",
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
