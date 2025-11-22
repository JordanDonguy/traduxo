import React from "react";
import { View, FlatList } from "react-native";
import AppText from "../AppText";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useTranslationHistory } from "@traduxo/packages/hooks/history/useTranslationHistory";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import Toast from "react-native-toast-message";
import { useScrollGradient } from "@/hooks/useScrollGradient";
import TopGradient from "./TopGradient";
import LoadingSpinner from "./LoadingSpinner";
import TranslationItem from "./TranslationItem";

export default function TranslationHistory() {
  const { setShowMenu, setError } = useApp();
  const { status } = useAuth();
  const { translationHistory } = useTranslationContext();
  const { onScroll, showTopGradient } = useScrollGradient();

  const { deleteTranslation, isLoading } = useTranslationHistory({});
  const { selectTranslation } = useSelectTranslation({ setError });

  // Delete a translation from history
  const handleDelete = async (id: string) => {
    const res = await deleteTranslation(id);
    if (!res.success) {
      Toast.show({
        type: "error",
        text1: res.message,
        text1Style: ({ fontSize: 14 })
      })
    };
    Toast.show({
      text1: "Translation deleted from history 👍",
      text1Style: ({ fontSize: 14 })
    })
  };

  return (
    <>
      <View className="relative flex-1">

        {status !== "authenticated" ? (
          <AppText className="text-xl pt-10 text-center">
            You need to log in to have access to your translation history
          </AppText>

        ) : !translationHistory.length ? (
          <AppText className="text-xl pt-10 text-center">
            No translations found in history...
          </AppText>

        ) : (isLoading) ? (
          <LoadingSpinner />

        ) : (
          <View className="flex flex-col gap-6 pb-24">
            {status === "authenticated" && translationHistory.length > 0 && (
              <FlatList
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                data={translationHistory}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <TranslationItem
                    key={item.id}
                    t={item}
                    setShowMenu={setShowMenu}
                    selectTranslation={selectTranslation}
                    deleteTranslation={handleDelete}
                    isFavorite={false}
                  />
                )}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
              />
            )}
          </View>
        )}
      </View>

      <TopGradient show={showTopGradient} />
    </>
  );
}
