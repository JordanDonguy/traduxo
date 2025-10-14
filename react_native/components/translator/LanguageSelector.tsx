import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import ISO6391 from "iso-639-1";
import { ArrowRightLeft, X } from "lucide-react-native";

type Props = {
  inputLang: string;
  outputLang: string;
  setInputLang: (lang: string) => void;
  setOutputLang: (lang: string) => void;
  isSwitching: boolean;
  switchLanguage: () => void;
};

export default function LanguageSelector({
  inputLang,
  outputLang,
  setInputLang,
  setOutputLang,
  isSwitching,
  switchLanguage,
}: Props) {
  const { colors } = useTheme();
  const [openInput, setOpenInput] = useState(false);
  const [openOutput, setOpenOutput] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const { height: screenHeight } = Dimensions.get("window");
  const modalMaxHeight = screenHeight * 0.75;

  // Input languages include "auto"
  const inputLanguages = [
    { key: "auto", label: "✨ Auto" },
    ...ISO6391.getAllCodes().map((code) => ({
      key: code,
      label: ISO6391.getName(code),
    })),
  ];

  // Output languages exclude "auto"
  const outputLanguages = ISO6391.getAllCodes().map((code) => ({
    key: code,
    label: ISO6391.getName(code),
  }));

  // Animated values for smooth transition
  const inputTranslate = useRef(new Animated.Value(0)).current;
  const outputTranslate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const width = 100;
    setIsAnimating(true); // animation starts
    Animated.timing(inputTranslate, {
      toValue: isSwitching ? width : 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => setIsAnimating(false)); // animation ends

    Animated.timing(outputTranslate, {
      toValue: isSwitching ? -width : 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [isSwitching]);

  const renderItem = (item: { key: string; label: string }, onSelect: (key: string) => void) => (
    <TouchableOpacity
      key={item.key}
      onPress={() => onSelect(item.key)}
      className="py-3 px-4 border-b border-gray-600"
    >
      <Text className="font-sans text-black dark:text-white text-lg">{item.label}</Text>
    </TouchableOpacity>
  );

  const renderModal = (
    visible: boolean,
    setVisible: (val: boolean) => void,
    onSelect: (key: string) => void,
    languages: { key: string; label: string }[]
  ) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)} >
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View className="flex-1 bg-white/50 dark:bg-black/50 justify-center">
          <TouchableWithoutFeedback>
            <View
              className="bg-zinc-300 dark:bg-zinc-800 mx-4 rounded-xl"
              style={{ maxHeight: modalMaxHeight }}
            >
              <TouchableOpacity
                onPress={() => setVisible(false)}
                className="self-end p-3"
              >
                <X color={colors.text} size={24} />
              </TouchableOpacity>

              <FlatList
                data={languages}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) =>
                  renderItem(item, (key) => {
                    onSelect(key);
                    setVisible(false);
                  })
                }
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <View className="flex-row items-center justify-between w-full mt-4">
      {/* Input Language */}
      <Animated.View
        style={{ flex: 1, transform: [{ translateX: inputTranslate }] }}
      >
        <TouchableOpacity
          className="bg-zinc-300 dark:bg-zinc-800 rounded-2xl py-4 px-4 mx-1"
          onPress={() => setOpenInput(true)}
        >
          <Text className="font-sans text-center text-lg text-black dark:text-white">
            {inputLanguages.find((l) => l.key === inputLang)?.label}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Switch Button */}
      <TouchableOpacity
        onPress={switchLanguage}
        disabled={isAnimating} // disable while animating
        className="w-16 h-16 mx-2 rounded-full flex items-center justify-center bg-zinc-300 dark:bg-zinc-800"
      >
        <ArrowRightLeft color={colors.text} />
      </TouchableOpacity>

      {/* Output Language */}
      <Animated.View
        style={{ flex: 1, transform: [{ translateX: outputTranslate }] }}
      >
        <TouchableOpacity
          className="bg-zinc-300 dark:bg-zinc-800 rounded-2xl py-4 px-4 mx-1"
          onPress={() => setOpenOutput(true)}
        >
          <Text className="font-sans text-center text-lg text-black dark:text-white">
            {outputLanguages.find((l) => l.key === outputLang)?.label}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Modals */}
      {renderModal(openInput, setOpenInput, setInputLang, inputLanguages)}
      {renderModal(openOutput, setOpenOutput, setOutputLang, outputLanguages)}
    </View>
  );
}
