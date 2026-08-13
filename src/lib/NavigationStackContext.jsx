import { createContext, useContext, useState, useCallback } from "react";

const NavigationStackContext = createContext(null);

export function NavigationStackProvider({ children }) {
  const [stacks, setStacks] = useState({
    Welcome: ["/"],
    Schedule: ["/Schedule"],
    Forecast: ["/Forecast"],
    Notices: ["/Notices"],
    Info: ["/Info"],
  });

  const [scrollPositions, setScrollPositions] = useState({});
  const [activeTab, setActiveTab] = useState("Welcome");

  const pushPage = useCallback((tab, path) => {
    setStacks(prev => ({
      ...prev,
      [tab]: [...(prev[tab] || []), path],
    }));
  }, []);

  const popPage = useCallback((tab) => {
    setStacks(prev => {
      const stack = prev[tab] || [];
      if (stack.length > 1) {
        return { ...prev, [tab]: stack.slice(0, -1) };
      }
      return prev;
    });
  }, []);

  const resetTab = useCallback((tab) => {
    const rootPath = `/${tab}`;
    setStacks(prev => ({
      ...prev,
      [tab]: [rootPath],
    }));
    setScrollPositions(prev => {
      const updated = { ...prev };
      delete updated[tab];
      return updated;
    });
  }, []);

  const getCurrentPath = useCallback((tab) => {
    const stack = stacks[tab] || [];
    return stack[stack.length - 1] || `/${tab}`;
  }, [stacks]);

  const saveScrollPosition = useCallback((tab, position) => {
    setScrollPositions(prev => ({
      ...prev,
      [tab]: position,
    }));
  }, []);

  const getScrollPosition = useCallback((tab) => {
    return scrollPositions[tab] || 0;
  }, [scrollPositions]);

  return (
    <NavigationStackContext.Provider
      value={{
        stacks,
        activeTab,
        setActiveTab,
        pushPage,
        popPage,
        resetTab,
        getCurrentPath,
        saveScrollPosition,
        getScrollPosition,
      }}
    >
      {children}
    </NavigationStackContext.Provider>
  );
}

export function useNavigationStack() {
  const context = useContext(NavigationStackContext);
  if (!context) {
    throw new Error("useNavigationStack must be used within NavigationStackProvider");
  }
  return context;
}