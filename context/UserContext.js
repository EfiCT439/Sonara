 import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [isPremium, setIsPremium] = useState(false);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [skipsResetTime, setSkipsResetTime] = useState(Date.now());

  const useSkip = () => {
    // Reset skips after 1 hour
    if (Date.now() - skipsResetTime > 3600000) {
      setSkipsUsed(0);
      setSkipsResetTime(Date.now());
    }
    if (!isPremium && skipsUsed >= 8) {
      return false;
    }
    setSkipsUsed(skipsUsed + 1);
    return true;
  };

  const skipsRemaining = isPremium ? 'Unlimited' : Math.max(0, 8 - skipsUsed);

  return (
    <UserContext.Provider value={{
      isPremium,
      setIsPremium,
      skipsUsed,
      skipsRemaining,
      useSkip,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
