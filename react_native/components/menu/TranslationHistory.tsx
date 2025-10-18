import React from "react";
import { View, Text, FlatList } from "react-native";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useTranslationHistory } from "@traduxo/packages/hooks/history/useTranslationHistory";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useScrollGradient } from "@/hooks/useScrollGradient";
import TopGradient from "./TopGradient";
import LoadingSpinner from "./LoadingSpinner";
import TranslationItem from "./TranslationItem";

export default function TranslationHistory() {
  const { setShowMenu } = useApp();
  const { status } = useAuth();
  const { translationHistory } = useTranslationContext();
  const { onScroll, showTopGradient } = useScrollGradient();

  const { deleteTranslation, isLoading } = useTranslationHistory({});
  const { selectTranslation } = useSelectTranslation({});

  return (
    <>
      <View className="relative flex-1">

        {status !== "authenticated" ? (
          <Text className="text-xl pt-10 text-center dark:text-white">
            You need to log in to have access to your translation history
          </Text>
        ) : !translationHistory.length ? (
          <Text className="text-xl pt-10 text-center dark:text-white">
            No translations found in history...
          </Text>
        ) : (isLoading) ? <LoadingSpinner /> : (
          <View className="flex flex-col gap-6 pb-24">
            {status === "authenticated" && translationHistory.length > 0 && (
              <FlatList
                onScroll={onScroll}
                data={translationHistory}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <TranslationItem
                    key={item.id}
                    t={item}
                    setShowMenu={setShowMenu}
                    selectTranslation={selectTranslation}
                    deleteTranslation={deleteTranslation}

                  />
                )}
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
