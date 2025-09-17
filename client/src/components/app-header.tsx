import { Menu } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
  showMenu?: boolean;
}

export default function AppHeader({ 
  title = "KAVARA", 
  subtitle,
  onMenuClick,
  showMenu = true 
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/80">{subtitle}</p>
            )}
          </div>
        </div>
        {showMenu && (
          <button className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors" onClick={onMenuClick}>
            <Menu className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </header>
  );
}