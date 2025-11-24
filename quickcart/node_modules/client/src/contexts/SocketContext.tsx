import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'; // <-- 1. Fix type import
import { io, type Socket } from 'socket.io-client'; // <-- 2. Fix type import
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    // Connect to backend
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Global Listener for New Orders (For Drivers/Admins)
    // 3. Replaced 'any' with specific type
    newSocket.on('new_order', (data: { id: string; totalPrice: number }) => {
      console.log("New Order Received:", data);
      // You can uncomment this to show a global toast for everyone
      // showToast(`New Order Received: ₹${data.totalPrice}`, 'success');
    });

    return () => {
      newSocket.close();
    };
  }, [showToast]); // 4. Added dependency

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};