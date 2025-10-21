import React from "react";
import { ScrollView, View, TouchableOpacity, Linking, Text } from "react-native";
import { useScrollGradient } from "@/hooks/useScrollGradient";
import TopGradient from "./TopGradient";
import AppText from "../AppText";

export default function PrivacyPolicy() {
  const { onScroll, showTopGradient } = useScrollGradient();

  return (
    <>
      <ScrollView
        className="flex-1 w-full mb-24"
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
      >

        {/* Header */}
        <AppText className="text-2xl font-bold mb-1">Privacy Policy</AppText>
        <AppText className="italic text-sm mb-4">Last updated: August 25, 2025</AppText>

        <AppText className="mb-6">
          Your privacy is important to us. This Privacy Policy explains what information we collect, how we use it, and what rights you have regarding your data when you use Traduxo app.
        </AppText>

        {/* Section 1 */}
        <AppText className="text-xl font-bold mb-2">1. Information We Collect</AppText>
        <AppText>When you use our app, we collect the following data:</AppText>

        <View className="pl-4 py-2">
          {/* User account data */}
          <View className="pb-2">
            <AppText className="font-bold">User account data</AppText>
            <View className="pl-8 mt-1">
              <AppText>• Email address</AppText>
              <AppText>• Preferred explanation language</AppText>
            </View>
          </View>

          {/* Translation history */}
          <View className="pb-2">
            <AppText className="font-bold">Translation history</AppText>
            <View className="pl-8 mt-1">
              <AppText>• Original text</AppText>
              <AppText>• Translations</AppText>
              <AppText>• Alternative translations</AppText>
              <AppText>• Input language</AppText>
              <AppText>• Output language</AppText>
              <AppText>• Date and time of creation</AppText>
            </View>
          </View>

          {/* Favorites */}
          <View>
            <AppText className="font-bold">Favorites</AppText>
            <View className="pl-8 mt-1">
              <AppText>• Original text</AppText>
              <AppText>• Translations</AppText>
              <AppText>• Alternative translations</AppText>
              <AppText>• Input language</AppText>
              <AppText>• Output language</AppText>
              <AppText>• Date and time of creation</AppText>
            </View>
          </View>
        </View>

        {/* Section 2 */}
        <AppText className="text-xl font-bold mb-2 mt-4">2. How We Use Your Information</AppText>
        <AppText>We use the collected information to:</AppText>
        <View className="pl-8 mt-1">
          <AppText>• Provide and improve translation services</AppText>
          <AppText>• Save your history and favorites for your personal use</AppText>
          <AppText>• Improve the AI-generated suggestions (avoid repetitions)</AppText>
          <AppText>• Communicate with you (e.g., account support, updates)</AppText>
        </View>

        {/* Section 3 */}
        <AppText className="text-xl font-bold mb-2 mt-6">3. Data Sharing and Disclosure</AppText>
        <AppText className="mb-2">
          We do not sell or share your personal information with third parties for marketing purposes.
        </AppText>
        <AppText>We may share data only in the following cases:</AppText>

        <View className="pl-4 py-2">
          <View className="pb-2">
            <AppText className="font-bold">With service providers:</AppText>
            <View className="pl-8 mt-1">
              <AppText>• We use trusted third-party providers to operate our app (e.g., hosting, authentication, database).</AppText>
            </View>
          </View>

          <View className="pb-2">
            <AppText className="font-bold">With Google Gemini</AppText>
            <View className="pl-8 mt-1">
              <AppText>• To provide translations and explanations, your inputs (such as text you submit for translation) are sent to Google Gemini, an AI service provided by Google.</AppText>
              <AppText>• According to Google’s policies, submitted data may be used to improve Google’s AI models.</AppText>
              <AppText>• We do not control how Google uses this data, but you can review their privacy policy:</AppText>
              <TouchableOpacity
                onPress={() => Linking.openURL("https://policies.google.com/privacy")}
              >
                <Text className="text-blue-500 underline mt-1">Google Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>

          <AppText className="font-bold">If required by law or to protect our legal rights.</AppText>
        </View>

        {/* Section 4 */}
        <AppText className="text-xl font-bold mb-2 mt-6">4. Data Retention and Deletion</AppText>
        <View className="pl-4 mt-1">
          <AppText>• Your data (history, favorites, account info) is stored securely while you maintain an account.</AppText>
          <AppText>
            • You may request deletion of your account and all associated data at any time by using the “delete account” button in the user menu or by contacting us at:
          </AppText>
          <TouchableOpacity onPress={() => Linking.openURL("mailto:support@traduxo.app")}>
              <Text
                className="text-blue-500 underline mt-1 pl-2"
                onPress={() => Linking.openURL("mailto:support@traduxo.app")}
              >
                support@traduxo.app
              </Text>
          </TouchableOpacity>
        </View>

        {/* Section 5 */}
        <AppText className="text-xl font-bold mb-2 mt-6">5. Security</AppText>
        <AppText>
          We take appropriate technical and organizational measures to protect your data from unauthorized access, loss, or misuse. However, no method of electronic transmission or storage is 100% secure.
        </AppText>

        {/* Section 6 */}
        <AppText className="text-xl font-bold mb-2 mt-6">6. Your Rights</AppText>
        <AppText className="mb-2">Depending on your location, you may have the right to:</AppText>
        <View className="pl-8">
          <AppText>• Access the data we hold about you</AppText>
          <AppText>• Correct or update your information</AppText>
          <AppText>• Request deletion of your account and data</AppText>
          <AppText>• Opt-out of certain data uses</AppText>
        </View>
        <AppText className="pl-2 mt-2">
          ➤ To exercise these rights, please contact us at:
        </AppText>
        <Text
          className="text-blue-500 underline mt-1 pl-4"
          onPress={() => Linking.openURL("mailto:support@traduxo.app")}
        >
          support@traduxo.app
        </Text>

        {/* Section 7 */}
        <AppText className="text-xl font-bold mb-2 mt-6">7. Changes to This Policy</AppText>
        <AppText>
          We may update this Privacy Policy from time to time. Any changes will be posted here with the updated date.
        </AppText>

        {/* Section 8 */}
        <AppText className="text-xl font-bold mb-2 mt-6">8. Contact Us</AppText>
        <AppText className="mb-2">
          If you have any questions about this Privacy Policy, please contact us at:
        </AppText>
        <TouchableOpacity className="mb-10" onPress={() => Linking.openURL("mailto:support@traduxo.app")}>
          <Text
            className="text-blue-500 underline pl-4"
            onPress={() => Linking.openURL("mailto:support@traduxo.app")}
          >
            support@traduxo.app
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TopGradient show={showTopGradient} />
    </>
  );
}
