import { ref, get, push, update, remove } from "firebase/database";
import { db } from "@/firebase"; // Adjust this to your Firebase configuration path
import { useStore } from "@/store";
import { Settings } from "@/types";

export const firebaseSettingsSync = () => {
  const settingsRef = ref(db, "GetSettings");
  const setSettings = useStore((state) => state.setSettings);

  // Function to fetch settings once (not in real-time)
  const fetchSettings = async () => {
    try {
      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const settingsData = snapshot.val() as Record<string, Settings>;
        // Transform the settings data from object to array
        const settingsArray = Object.entries(settingsData).map(
          ([key, value]) => ({
            ID: key,
            ...value,
          })
        );
        // Update the Zustand store with the fetched settings
        setSettings(settingsArray);
      } else {
        console.log("No settings data available");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const firebaseAddSettings = async (setting: any) => {
    const newRef = push(settingsRef);
    await update(newRef, setting);
    fetchSettings(); // Optionally fetch and update settings again
  };

  const firebaseUpdateSettings = async (updatedSetting: any) => {
    const settingRef = ref(db, `GetSettings/${updatedSetting.ID}`);
    await update(settingRef, updatedSetting);
    fetchSettings(); // Optionally fetch and update settings again
  };

  const firebaseDeleteSettings = async (settingId: any) => {
    const settingRef = ref(db, `GetSettings/${settingId}`);
    await remove(settingRef);
    fetchSettings(); // Optionally fetch and update settings again
  };

  return {
    fetchSettings,
    firebaseAddSettings,
    firebaseUpdateSettings,
    firebaseDeleteSettings,
  };
};
