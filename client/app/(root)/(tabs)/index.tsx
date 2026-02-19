import * as React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <MotiView style={styles.container}>
      <LinearGradient
        colors={["#4D2FB2", "rgba(0,0,0,0.7)"]}
        style={styles.gradient}
      >
        <View
          style={styles.safeArea}
        >
          <View className='flex-row items-center justify-between px-5 w-full' style={{ position: "absolute", top: Platform.OS === "ios" ? 56 : 16, zIndex: 999 }}>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => router.push("/(root)/(modals)/chat")}
            >
              <View style={styles.profileGradient}>
                <Ionicons name="chatbubbles-outline" size={32} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/notifications")}
            >
              <View style={styles.profileGradient}>
                <Ionicons name="notifications-outline" size={32} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <MotiView style={styles.contentContainer}>
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 800,
                }}
              >
                <Image
                  source={require("../../../assets/images/splash-icon.png")}
                  style={styles.logo}
                />
              </MotiView>

              <MotiView
                from={{ translateY: 20, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                transition={{
                  type: "timing",
                  duration: 800,
                }}
              >
                <Text style={styles.welcomeText}>
                  Բարի գալուստ Ձեր Ֆինանսական Ճանապարհին
                </Text>
                <Text style={styles.descriptionText}>
                  Կառավարեք Ձեր բիզնեսի ֆինանսները մեր հզոր վահանակով
                </Text>
              </MotiView>

              <MotiView
                style={styles.featuresContainer}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "timing",
                  duration: 800,
                  delay: 200,
                }}
              >
                <MotiView
                  style={styles.featureItem}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    type: "timing",
                    duration: 600,
                    delay: 400,
                  }}
                >
                  <Ionicons name="analytics" size={24} color="#01a06d" />
                  <Text style={styles.featureText}>
                    Իրական ժամանակի վերլուծություն
                  </Text>
                </MotiView>
                <MotiView
                  style={styles.featureItem}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    type: "timing",
                    duration: 600,
                    delay: 600,
                  }}
                >
                  <Ionicons name="trending-up" size={24} color="#01a06d" />
                  <Text style={styles.featureText}>Աճի հետևում</Text>
                </MotiView>
                <MotiView
                  style={styles.featureItem}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    type: "timing",
                    duration: 600,
                    delay: 800,
                  }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={24}
                    color="#01a06d"
                  />
                  <Text style={styles.featureText}>Անվտանգ հարթակ</Text>
                </MotiView>
              </MotiView>

              <MotiView
                style={styles.statsContainer}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 800,
                  delay: 1000,
                }}
              >
                <Text style={styles.sectionTitle}>
                  Հիմնական Վիճակագրություն
                </Text>
                <View style={styles.statsGrid}>
                  <MotiView
                    style={styles.statCard}
                    from={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 200 }}
                  >
                    <LinearGradient
                      colors={["#4CAF50", "#45a049"]}
                      style={styles.statGradient}
                    >
                      <Ionicons name="cash" size={32} color="#ffffff" />
                      <Text style={styles.statValue}>$24.5K</Text>
                      <Text style={styles.statLabel}>Եկամուտ</Text>
                    </LinearGradient>
                  </MotiView>
                  <MotiView
                    style={styles.statCard}
                    from={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 400 }}
                  >
                    <View
                      style={[
                        styles.statGradient,
                        { backgroundColor: "royalblue" },
                      ]}
                    >
                      <Ionicons name="people" size={32} color="#ffffff" />
                      <Text style={styles.statValue}>1.2K</Text>
                      <Text style={styles.statLabel}>Հաճախորդներ</Text>
                    </View>
                  </MotiView>
                </View>
              </MotiView>

              <MotiView
                style={styles.quickActionsContainer}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 800,
                  delay: 600,
                }}
              >
                <Text style={styles.sectionTitle}>Արագ Գործողություններ</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => router.push("/plan")}
                  >
                    <LinearGradient
                      colors={["#FF9800", "#F57C00"]}
                      style={styles.quickActionGradient}
                    >
                      <Ionicons name="add-circle" size={24} color="#ffffff" />
                      <Text style={styles.quickActionText}>Նոր Պլան</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionButton}>
                    <LinearGradient
                      colors={["#9C27B0", "#7B1FA2"]}
                      style={styles.quickActionGradient}
                    >
                      <Ionicons
                        name="document-text"
                        size={24}
                        color="#ffffff"
                      />
                      <Text style={styles.quickActionText}>
                        Հաշվետվություններ
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </MotiView>

              <MotiView
                style={styles.activityContainer}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: "timing",
                  duration: 800,
                  delay: 800,
                }}
              >
                <Text style={styles.sectionTitle}>
                  Վերջին Գործողությունները
                </Text>
                <View style={styles.activityList}>
                  <MotiView
                    style={styles.activityItem}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: 1000 }}
                  >
                    <View style={styles.activityIcon}>
                      <Ionicons name="time" size={24} color="#ffffff" />
                    </View>
                    <Text style={styles.activityText}>
                      Վերջին մուտք՝ 2 ժամ առաջ
                    </Text>
                  </MotiView>
                </View>
                <TouchableOpacity
                  style={styles.dashboardButton}
                  onPress={() =>
                    router.push(
                      `/(root)/(tabs)/(dashboard)?businessPlanData=${encodeURIComponent(
                        JSON.stringify({
                          businessName: "test",
                          place: "test",
                          uniqueTags: ["test"],
                          idea: "test",
                        }),
                      )}` as any,
                    )
                  }
                >
                  <LinearGradient
                    colors={["#01a06d", "#00c853"]}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Բացել Վահանակը</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#ffffff"
                      style={styles.buttonIcon}
                    />
                  </LinearGradient>
                </TouchableOpacity>
              </MotiView>
            </MotiView>
            <StatusBar backgroundColor="#001941" barStyle="light-content" />
          </ScrollView>
        </View>
      </LinearGradient>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  backgroundImage: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 40
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: 80,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  welcomeText: {
    fontFamily: "Arm_Hmks_Bebas_Neue",
    fontSize: 38,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: "Arm_Hmks_Bebas_Neue",
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.9,
  },
  featuresContainer: {
    width: "100%",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureText: {
    color: "#ffffff",
    fontSize: 18,
    marginLeft: 12,
    fontFamily: "Arm_Hmks_Bebas_Neue",
  },
  dashboardButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 22,
    marginRight: 8,
    fontFamily: "Arm_Hmks_Bebas_Neue",
  },
  buttonIcon: {
    marginLeft: 4,
  },
  quickActionsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    color: "#ffffff",
    marginBottom: 16,
    fontFamily: "Arm_Hmks_Bebas_Neue",
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  quickActionButton: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
  },
  quickActionGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  quickActionText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 8,
    fontFamily: "Arm_Hmks_Bebas_Neue",
  },
  activityContainer: {
    width: "100%",
    marginBottom: 32,
  },
  activityList: {
    width: "100%",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Arm_Hmks_Bebas_Neue",
  },
  statsContainer: {
    width: "100%",
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  statCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
  },
  statGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 24,
    fontFamily: "Arm_Hmks_Bebas_Neue",
    marginVertical: 4,
  },
  statLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Arm_Hmks_Bebas_Neue",
    opacity: 0.9,
  },
  profileButton: {
    padding: 8,
    backgroundColor: "#4D2FB2",
    borderRadius: 100
  },
  chatButton: {
    padding: 8,
    backgroundColor: "#4D2FB2",
    borderRadius: 100
  },
  profileGradient: {
    borderRadius: 20,
    overflow: "hidden",
  },
});
