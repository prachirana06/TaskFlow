
import { createContext, useContext } from "react";

export const SidebarContext = createContext(null);

export function useSidebar() {
    const context = useContext(SidebarContext);

    if (!context) {
        return {
            sidebarOpen: true,
            toggleSidebar: () => {},
            closeSidebar: () => {},
        };
    }

    return context;
}
