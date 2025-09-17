// This file contains mock user data for development purposes
// In production, this would come from Telegram WebApp API

export const mockUser = {
  id: "mock-user-1",
  telegramId: "123456789",
  username: "testuser",
  firstName: "Тест",
  lastName: "Пользователь",
};

export const mockTelegramWebApp = {
  initDataUnsafe: {
    user: {
      id: 123456789,
      first_name: "Тест",
      last_name: "Пользователь",
      username: "testuser",
    },
  },
  ready: () => console.log("Telegram WebApp ready"),
  expand: () => console.log("Telegram WebApp expanded"),
  close: () => console.log("Telegram WebApp closed"),
  MainButton: {
    text: "",
    color: "#FF6B35",
    textColor: "#FFFFFF",
    isVisible: false,
    isActive: true,
    show: () => console.log("MainButton shown"),
    hide: () => console.log("MainButton hidden"),
    enable: () => console.log("MainButton enabled"),
    disable: () => console.log("MainButton disabled"),
    setText: (text: string) => console.log("MainButton text:", text),
    onClick: (callback: () => void) => console.log("MainButton click handler set"),
    offClick: (callback: () => void) => console.log("MainButton click handler removed"),
  },
};

// Mock Telegram WebApp if not available
declare global {
  interface Window {
    Telegram?: {
      WebApp: typeof mockTelegramWebApp;
    };
  }
}

if (typeof window !== "undefined" && !window.Telegram) {
  window.Telegram = {
    WebApp: mockTelegramWebApp,
  };
}
