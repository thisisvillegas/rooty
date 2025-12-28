import { STORAGE_KEY, STORAGE_VERSION } from '../data/constants.js';

// Migrate data from older versions to current version
function migrateData(data, fromVersion) {
  let migratedData = { ...data };

  // Migrate from v3 to v4: Add gardenObjects and offGardenObjects arrays
  if (fromVersion < 4) {
    console.log('Migrating storage from v3 to v4: adding garden objects support');
    migratedData.gardenObjects = migratedData.gardenObjects || [];
    migratedData.offGardenObjects = migratedData.offGardenObjects || [];
  }

  return migratedData;
}

// Load garden data from localStorage
export function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);

    // Version check - migrate if possible, otherwise return null
    if (parsed.version !== STORAGE_VERSION) {
      // Attempt migration from older versions
      if (parsed.version && parsed.version >= 3 && parsed.version < STORAGE_VERSION) {
        console.log(`Migrating storage from v${parsed.version} to v${STORAGE_VERSION}`);
        const migratedData = migrateData(parsed.data, parsed.version);
        // Save the migrated data
        saveToStorage(migratedData);
        return migratedData;
      }
      console.log('Storage version too old or invalid, starting fresh');
      return null;
    }

    return parsed.data;
  } catch (e) {
    console.error('Failed to load from storage:', e);
    return null;
  }
}

// Save garden data to localStorage
export function saveToStorage(data) {
  try {
    const payload = {
      version: STORAGE_VERSION,
      data,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.error('Failed to save to storage:', e);
    return false;
  }
}

// Clear all garden data from localStorage
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear storage:', e);
    return false;
  }
}
