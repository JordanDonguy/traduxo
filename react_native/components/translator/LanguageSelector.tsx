import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { MotiView } from "moti";
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
    <Modal visible={visible} transparent onRequestClose={() => setVisible(false)}>
      <TouchableWithoutFeedback onPress={() => setVisible(false)}>
        <View className="flex-1 justify-center items-center bg-white/50 dark:bg-black/50 px-4">
          <MotiView
            from={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              scale: { type: "spring", damping: 40, stiffness: 500, mass: 2.5 },
              opacity: { type: "timing", duration: 250 },
            }}
            style={{ maxHeight: modalMaxHeight }}
            className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl border border-zinc-950 dark:border-zinc-500"
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={{ alignSelf: "flex-end", padding: 12 }}
            >
              <X color={colors.text} size={24} />
            </TouchableOpacity>

            {/* Language List */}
            <FlatList
              data={languages}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item.key);
                    setVisible(false);
                  }}
                  className="py-3 px-4 border-b border-gray-600"
                >
                  <Text className="text-black dark:text-white text-lg">
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </MotiView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );


  return (
    <View className="flex-row items-center justify-between w-full mt-4">
      {/* Input Language */}
      <MotiView
        animate={{
          translateX: isSwitching ? 100 : 0,
        }}
        transition={{
          type: "spring",
          damping: 40,
          mass: 0.8,
        }}
        onDidAnimate={(key, finished) => {
          if (key === "translateX" && finished) setIsAnimating(false);
        }}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          className="bg-zinc-200 dark:bg-zinc-800 rounded-2xl py-4 px-4 mx-1"
          onPress={() => setOpenInput(true)}
        >
          <Text className="font-sans text-center text-lg text-black dark:text-white">
            {inputLanguages.find((l) => l.key === inputLang)?.label}
          </Text>
        </TouchableOpacity>
      </MotiView>

      {/* Switch Button */}
      <TouchableOpacity
        onPress={switchLanguage}
        disabled={isAnimating} // disable while animating
        className="w-16 h-16 mx-2 rounded-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800"
      >
        <ArrowRightLeft color={colors.text} />
      </TouchableOpacity>

      {/* Output Language */}
      <MotiView
        animate={{
          translateX: isSwitching ? -100 : 0,
        }}
        transition={{
          type: "spring",
          damping: 40,
          mass: 0.8,
        }}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          className="bg-zinc-200 dark:bg-zinc-800 rounded-2xl py-4 px-4 mx-1"
          onPress={() => setOpenOutput(true)}
        >
          <Text className="font-sans text-center text-lg text-black dark:text-white">
            {outputLanguages.find((l) => l.key === outputLang)?.label}
          </Text>
        </TouchableOpacity>
      </MotiView>

      {/* Modals */}
      {renderModal(openInput, setOpenInput, setInputLang, inputLanguages)}
      {renderModal(openOutput, setOpenOutput, setOutputLang, outputLanguages)}
    </View>
  );
}
