import { useEffect, useCallback, useState, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTelegram } from "./hooks/use-telegram";
import Home from "./pages/home";
import Quiz from "./pages/quiz";
import PersonalBoxes from "./pages/personal-boxes";
import Boxes from "./pages/boxes";
import About from "./pages/about";
import Order from "./pages/order";
import OrderSuccess from "./pages/order-success";
import Checkout from "./pages/checkout";
import PaymentSuccess from "./pages/payment-success";
import MyOrders from "./pages/my-orders";
import OrderDetails from "./pages/order-details";
import Profile from "./pages/profile";
import Info from "./pages/info";
import Cart from "./pages/cart";
import NotFound from "./pages/not-found";
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard";
import AdminCreateBox from "./pages/admin/create-box";
import TelegramRequired from "./pages/telegram-required";
import BottomNav from "./components/bottom-nav";
import Catalog from "./pages/catalog";
import BoxDetail from "./pages/box-detail";
import ProductDetail from "./pages/product-detail";
import PrivacyPolicy from "./pages/privacy-policy";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/boxes" component={Boxes} />
      <Route path="/box/:id" component={BoxDetail} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/personal-boxes" component={PersonalBoxes} />
      <Route path="/about" component={About} />
      <Route path="/order" component={Order} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/order-success" component={OrderSuccess} />
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/order-details" component={OrderDetails} />
      <Route path="/cart" component={Cart} />
      <Route path="/profile" component={Profile} />
      <Route path="/info" component={Info} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/create-box" component={AdminCreateBox} />
      <Route path="/admin" component={AdminLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location, navigate] = useLocation();
  const { isInTelegram, webApp, hapticFeedback } = useTelegram();
  const bonusActivatedRef = useRef(false);
  const [bonusModal, setBonusModal] = useState<{ open: boolean; title: string; message: string; success: boolean }>({ open: false, title: '', message: '', success: false });
  const isAdminPage = location.startsWith('/admin');
  const isHomePage = location === '/';

  const handleBackButton = useCallback(() => {
    hapticFeedback.impact('light');
    navigate('/');
  }, [navigate, hapticFeedback]);

  useEffect(() => {
    if (!webApp || isAdminPage) return;
    
    const version = parseFloat(webApp.version || '0');
    if (version < 6.1) return;

    if (isHomePage) {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBackButton);
    }

    return () => {
      webApp.BackButton.offClick(handleBackButton);
    };
  }, [webApp, isHomePage, isAdminPage, handleBackButton]);

  // Handle startapp parameter from Telegram deep links
  useEffect(() => {
    // Check for start_param from Telegram WebApp
    const startParam = webApp?.initDataUnsafe?.start_param;
    
    // Also check URL query parameter as fallback
    const urlParams = new URLSearchParams(window.location.search);
    const startAppParam = urlParams.get('startapp');
    
    const param = startParam || startAppParam;
    
    if (param && location === '/') {
      // Navigate based on the parameter
      switch (param) {
        case 'catalog':
          navigate('/catalog');
          break;
        case 'boxes':
          navigate('/boxes');
          break;
        case 'quiz':
          navigate('/quiz');
          break;
        case 'orders':
          navigate('/my-orders');
          break;
        case 'support':
          navigate('/info');
          break;
        case 'privacy':
          navigate('/privacy-policy');
          break;
        case 'bonus500':
          if (!bonusActivatedRef.current) {
            bonusActivatedRef.current = true;
            const telegramId = webApp?.initDataUnsafe?.user?.id;
            if (telegramId) {
              fetch('/api/loyalty/activate-package-bonus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramId: String(telegramId) })
              })
                .then(r => r.json())
                .then(result => {
                  if (result.success) {
                    hapticFeedback.notification('success');
                    setBonusModal({ open: true, title: 'Бонус активирован!', message: result.message, success: true });
                  } else if (result.alreadyActivated) {
                    hapticFeedback.notification('warning');
                    setBonusModal({ open: true, title: 'Бонус уже активирован', message: result.message, success: false });
                  } else {
                    setBonusModal({ open: true, title: 'Ошибка', message: result.message, success: false });
                  }
                })
                .catch(() => {
                  setBonusModal({ open: true, title: 'Ошибка', message: 'Не удалось активировать бонус', success: false });
                });
            }
          }
          break;
        default:
          break;
      }
    }
  }, [webApp, location, navigate, hapticFeedback]);

  // In production, show TelegramRequired page if not in Telegram (except for admin pages)
  if (!import.meta.env.DEV && !isInTelegram && !isAdminPage) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TelegramRequired />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={isAdminPage ? "w-full min-h-screen bg-gray-50 font-inter" : "telegram-app font-inter"}>
          <Toaster />
          <Router />
          {!isAdminPage && <BottomNav />}
          <Dialog open={bonusModal.open} onOpenChange={(open) => setBonusModal(prev => ({ ...prev, open }))}>
            <DialogContent className="max-w-[320px] rounded-2xl text-center p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="text-6xl">{bonusModal.success ? '🎉' : '⚠️'}</div>
                <h2 className="text-xl font-bold">{bonusModal.title}</h2>
                <p className="text-gray-600">{bonusModal.message}</p>
                <Button 
                  className="w-full mt-2" 
                  onClick={() => setBonusModal(prev => ({ ...prev, open: false }))}
                >
                  Отлично
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;