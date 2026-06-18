import { NavLink } from 'react-router-dom';
import { Dumbbell, LayoutDashboard, UserCheck } from 'lucide-react';

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-gym-navy to-gym-navyDark shadow-lg shadow-gym-navy/20">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gym-orange flex items-center justify-center shadow-md shadow-gym-orange/40">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-none">
              锐力健身
            </h1>
            <p className="text-xs text-white/60 mt-0.5">会员课时管理系统</p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gym-orange text-white shadow-md shadow-gym-orange/40'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <UserCheck className="w-4 h-4" />
            前台操作
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gym-orange text-white shadow-md shadow-gym-orange/40'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            后台管理
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
