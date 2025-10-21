import React from "react";
import { View, Text, FlatList } from "react-native";
import { useFavoriteTranslations } from "@traduxo/packages/hooks/favorites/useFavoriteTranslations";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import LoadingSpinner from "./LoadingSpinner";
import TopGradient from "./TopGradient";
import { useScrollGradient } from "@/hooks/useScrollGradient";
import Toast from "react-native-toast-message";
import TranslationItem from "./TranslationItem";

export default function Favorites() {
  const { setShowMenu } = useApp();
  const { status } = useAuth();

  const { favoriteTranslations, isLoading, deleteTranslation } = useFavoriteTranslations({});
  const { selectTranslation } = useSelectTranslation({});

  const { onScroll, showTopGradient } = useScrollGradient();

  // Delete a translation from favorites
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
      text1: "Translation deleted from favorites 👍",
      text1Style: ({ fontSize: 14 })
    })
  };

  return (
    <>
      <View className="relative flex-1">

        <View className="flex flex-col gap-6 pb-24">

          {status !== "authenticated" ? (
            <Text className="text-xl pt-10 text-center dark:text-white">
              You need to log in to have access to your favorite translations
            </Text>

          ) : (!favoriteTranslations.length && !isLoading) ? (
            <Text className="text-xl pt-10 text-center dark:text-white">
              No favorite translations found...
            </Text>

          ) : (isLoading) ? (
            <LoadingSpinner />

          ) : (
            <FlatList
              onScroll={onScroll}
              data={favoriteTranslations}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TranslationItem
                  key={item.id}
                  t={item}
                  setShowMenu={setShowMenu}
                  selectTranslation={selectTranslation}
                  deleteTranslation={handleDelete}
                  isFavorite={true}
                />
              )}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
            />
          )}
        </View>
      </View>

      <TopGradient show={showTopGradient} />
    </>
  );
}
