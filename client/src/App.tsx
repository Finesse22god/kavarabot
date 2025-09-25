import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/home";
import Quiz from "./pages/quiz";
import PersonalBoxes from "./pages/personal-boxes";
import ReadyBoxes from "./pages/ready-boxes";
import Boxes from "./pages/boxes";
import About from "./pages/about";
import Order from "./pages/order";
import OrderSuccess from "./pages/order-success";
import Checkout from "./pages/checkout";
import PaymentSuccess from "./pages/payment-success";
import MyOrders from "./pages/my-orders";
import OrderDetails from "./pages/order-details";
import Profile from "./pages/profile";
import Cart from "./pages/cart";
import NotFound from "./pages/not-found";
import AdminLogin from "./pages/admin/login";
import AdminDashboard from "./pages/admin/dashboard";
import AdminCreateBox from "./pages/admin/create-box";
import BottomNav from "./components/bottom-nav";
import Catalog from "./pages/catalog";
import BoxDetail from "./pages/box-detail";
import ProductDetail from "./pages/product-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quiz" component={Quiz} />
      <Route path="/catalog" component={Catalog} />
      <Route path="/boxes" component={Boxes} />
      <Route path="/box/:id" component={BoxDetail} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/ready-boxes" component={ReadyBoxes} />
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
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/create-box" component={AdminCreateBox} />
      <Route path="/admin" component={AdminLogin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isAdminPage = location.startsWith('/admin');

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className={isAdminPage ? "w-full min-h-screen bg-gray-50 font-inter" : "telegram-app font-inter"}>
          <Toaster />
          <Router />
          {!isAdminPage && <BottomNav />}
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;