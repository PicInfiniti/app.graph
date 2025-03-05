import { applySettingsToUI } from '../ui/uiManager';

class AppSettings {
  static instance = null;
  #autoSave = true; // Private property

  constructor(eventBus) {
    if (AppSettings.instance) return AppSettings.instance; // Singleton pattern
    AppSettings.instance = this;

    this.eventBus = eventBus; // Store reference to passed EventBus
    this.debounceTimer = null;

    this.defaultSettings = {
      forceSimulation: true,
      dragComponent: false,
      scale: false,
      vertexLabel: true,
      node_radius: 10,
      edge_size: 2,
      label_size: 15,
      info_panel: true,
      grid: 20,
      color: "#4682B4"
    };

    // Load validated settings from localStorage or use defaults
    this.settings = this.loadFromLocalStorage();


    // Listen for external setting updates
    this.registerEventListeners();
  }

  init() {
    applySettingsToUI(this.settings);
    this.eventBus.emit("settingsChanged", this.getAllSettings());
  }

  registerEventListeners() {
    this.eventBus.on("updateSetting", (event) => {
      const { key, value } = event.detail;
      if (key && value !== undefined) {
        this.setSetting(key, value);
      }
    });

    this.eventBus.on("updateAllSettings", (event) => {
      const newSettings = event.detail;
      if (newSettings && typeof newSettings === "object") {
        this.setAllSettings(newSettings);
      }
    });

    this.eventBus.on("resetSettings", () => {
      this.resetToDefault();
    });

    this.eventBus.on("toggleSetting", (event) => {
      const { key } = event.detail;
      if (key) {
        this.toggleSetting(key);
      }
    });
  }

  loadFromLocalStorage() {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        return this.validateSettings(parsedSettings);
      } catch (error) {
        console.warn("Invalid settings in localStorage. Using defaults.");
      }
    }
    return { ...this.defaultSettings };
  }

  saveToLocalStorage() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      localStorage.setItem("appSettings", JSON.stringify(this.settings));
      console.log("Settings saved to localStorage");

      // Emit a global settings change event
      this.eventBus.emit("settingsChanged", this.getAllSettings());
    }, 500);
  }

  resetToDefault() {
    this.settings = { ...this.defaultSettings };
    this.eventBus.emit("settingsReset", this.settings);

    if (this.#autoSave) {
      this.saveToLocalStorage();
    }
    this.init();
  }

  getSetting(key) {
    return this.settings[key];
  }

  getAllSettings() {
    return { ...this.settings };
  }

  setSetting(key, value) {
    if (key in this.settings) {
      if (this.settings[key] !== value) {
        this.settings[key] = value;
        this.eventBus.emit("settingChanged", { key, value });

        if (this.#autoSave) {
          this.saveToLocalStorage();
        }
        this.init();
      }
    } else {
      console.warn(`Setting "${key}" does not exist.`);
    }
  }

  setAllSettings(newSettings) {
    Object.keys(newSettings).forEach((key) => {
      if (key in this.settings) {
        this.settings[key] = newSettings[key];
      }
    });

    this.eventBus.emit("settingsChanged", this.getAllSettings());

    if (this.#autoSave) {
      this.saveToLocalStorage();
    }
    this.init();
  }

  toggleSetting(key) {
    if (key in this.settings && typeof this.settings[key] === "boolean") {
      this.settings[key] = !this.settings[key];
      this.eventBus.emit("settingToggled", { key, value: this.settings[key] });

      if (this.#autoSave) {
        this.saveToLocalStorage();
      }
      this.init();
    } else {
      console.warn(`Setting "${key}" does not exist or is not a boolean.`);
    }
  }

  setAutoSave(enabled) {
    this.#autoSave = enabled;
  }

  validateSettings(saved) {
    return Object.keys(this.defaultSettings).reduce((acc, key) => {
      acc[key] = saved && saved.hasOwnProperty(key) ? saved[key] : this.defaultSettings[key];
      return acc;
    }, {});
  }
}

export default AppSettings;
