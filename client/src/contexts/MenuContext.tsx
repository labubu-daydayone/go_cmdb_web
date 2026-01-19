import { createContext, useContext, useState, ReactNode } from 'react';

interface MenuContextType {
  expandedMenu: string | null;
  setExpandedMenu: (menu: string | null) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  return (
    <MenuContext.Provider value={{ expandedMenu, setExpandedMenu }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within MenuProvider');
  }
  return context;
}
