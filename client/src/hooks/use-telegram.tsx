import { useState, useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          start_param?: string;
          auth_date: number;
          hash: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: {
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
          hint_color?: string;
          bg_color?: string;
          text_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isProgressVisible: boolean;
          isActive: boolean;
          setText(text: string): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(leaveActive?: boolean): void;
          hideProgress(): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        expand(): void;
        close(): void;
        ready(): void;
        sendData(data: string): void;
        openLink(url: string): void;
        openTelegramLink(url: string): void;
        showPopup(params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }, callback?: (buttonId: string) => void): void;
        showAlert(message: string, callback?: () => void): void;
        showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
        showScanQrPopup(params: {
          text?: string;
        }, callback?: (text: string) => void): void;
        closeScanQrPopup(): void;
        readTextFromClipboard(callback?: (text: string) => void): void;
        requestWriteAccess(callback?: (granted: boolean) => void): void;
        requestContact(callback?: (granted: boolean) => void): void;
        invokeCustomMethod(method: string, params: any, callback?: (error: any, result: any) => void): void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface UseTelegramReturn {
  user: TelegramUser | null;
  webApp: Window['Telegram']['WebApp'] | null;
  isInTelegram: boolean;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  showBackButton: () => void;
  hideBackButton: () => void;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  hapticFeedback: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    notification: (type: 'error' | 'success' | 'warning') => void;
    selection: () => void;
  };
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  close: () => void;
  expand: () => void;
}

export function useTelegram(): UseTelegramReturn {
  const [webApp, setWebApp] = useState<Window['Telegram']['WebApp'] | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isInTelegram, setIsInTelegram] = useState(false);

  useEffect(() => {
    const initTelegram = async () => {
      // Check if we're running in Telegram WebApp
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        setIsInTelegram(true);

        // Initialize the app
        tg.ready();
        tg.expand();

        // Set user data and create in database
        if (tg.initDataUnsafe?.user) {
          const telegramUser = tg.initDataUnsafe.user;
          setUser(telegramUser);
          
          // Extract referral code from start parameter
          let referralCode = null;
          if (tg.initDataUnsafe.start_param && tg.initDataUnsafe.start_param.startsWith('ref_')) {
            referralCode = tg.initDataUnsafe.start_param.replace('ref_', '');
          }
          
          // Create or get user in our database
          try {
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telegramId: telegramUser.id.toString(),
                username: telegramUser.username,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name,
                referralCode: referralCode,
              }),
            });
            
            if (!response.ok) {
              console.error('Failed to create/get user:', response.statusText);
            }
          } catch (error) {
            console.error('Error creating/getting user:', error);
          }
        } else {
          // No user in Telegram WebApp - use mock user for development
          const mockUser: TelegramUser = {
            id: 123456789,
            first_name: "Dev",
            last_name: "User",
            username: "devuser"
          };
          setUser(mockUser);
          
          // Create mock user in database
          try {
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                telegramId: mockUser.id.toString(),
                username: mockUser.username,
                firstName: mockUser.first_name,
                lastName: mockUser.last_name,
              }),
            });
            
            if (!response.ok) {
              console.error('Failed to create/get mock user:', response.statusText);
            }
          } catch (error) {
            console.error('Error creating/getting mock user:', error);
          }
        }

        // Apply theme
        document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');

      } else {
        // Not in Telegram environment - use mock user for development
        setIsInTelegram(false);
        
        // Set mock user for development
        const mockUser: TelegramUser = {
          id: 123456789,
          first_name: "Dev",
          last_name: "User",
          username: "devuser"
        };
        setUser(mockUser);
        
        // Create mock user in database
        try {
          const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              telegramId: mockUser.id.toString(),
              username: mockUser.username,
              firstName: mockUser.first_name,
              lastName: mockUser.last_name,
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to create/get mock user:', response.statusText);
          }
        } catch (error) {
          console.error('Error creating/getting mock user:', error);
        }
      }
    };

    initTelegram();
  }, []);

  const showBackButton = () => {
    webApp?.BackButton.show();
  };

  const hideBackButton = () => {
    webApp?.BackButton.hide();
  };

  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    webApp?.MainButton.hide();
  };

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'light') => {
      webApp?.HapticFeedback.impactOccurred(style);
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      webApp?.HapticFeedback.notificationOccurred(type);
    },
    selection: () => {
      webApp?.HapticFeedback.selectionChanged();
    }
  };

  const showAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (webApp) {
        webApp.showAlert(message, () => resolve());
      } else {
        alert(message);
        resolve();
      }
    });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webApp) {
        webApp.showConfirm(message, (confirmed) => resolve(confirmed));
      } else {
        resolve(confirm(message));
      }
    });
  };

  const close = () => {
    webApp?.close();
  };

  const expand = () => {
    webApp?.expand();
  };

  return {
    user,
    webApp,
    isInTelegram,
    colorScheme: webApp?.colorScheme || 'light',
    themeParams: webApp?.themeParams || {},
    showBackButton,
    hideBackButton,
    showMainButton,
    hideMainButton,
    hapticFeedback,
    showAlert,
    showConfirm,
    close,
    expand
  };
}