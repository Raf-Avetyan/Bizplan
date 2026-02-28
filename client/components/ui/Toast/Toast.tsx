import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import {
   CheckCircle2,
   AlertCircle,
   AlertTriangle,
   Info,
   X,
   CircleSlash
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
   id: string;
   title: string;
   message?: string;
   type: ToastType;
   duration?: number;
   onConfirm?: () => void;
   onCancel?: () => void;
   confirmText?: string;
   cancelText?: string;
}

interface ToastContextType {
   showToast: (title: string, message?: string, type?: ToastType, duration?: number) => void;
   showConfirm: (title: string, message: string, onConfirm: () => void, options?: {
      confirmText?: string;
      cancelText?: string;
      type?: ToastType;
      onCancel?: () => void;
   }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_COLORS = {
   success: {
      accent: '#10B981',
      subtleBg: 'rgba(16, 185, 129, 0.08)',
      Icon: CheckCircle2,
   },
   error: {
      accent: '#EF4444',
      subtleBg: 'rgba(239, 68, 68, 0.08)',
      Icon: AlertCircle,
   },
   warning: {
      accent: '#F59E0B',
      subtleBg: 'rgba(245, 158, 11, 0.08)',
      Icon: AlertTriangle,
   },
   info: {
      accent: '#3B82F6',
      subtleBg: 'rgba(59, 130, 246, 0.08)',
      Icon: Info,
   },
};

const ToastItem = ({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) => {
   const colors = TOAST_COLORS[toast.type];
   const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
   const isConfirm = !!toast.onConfirm;

   useEffect(() => {
      if (!isConfirm) {
         timerRef.current = setTimeout(() => {
            onDismiss(toast.id);
         }, toast.duration || 3000);
      }

      return () => {
         if (timerRef.current) clearTimeout(timerRef.current);
      };
   }, []);

   return (
      <MotiView
         from={{ translateY: -100, opacity: 0, scale: 0.9 }}
         animate={{ translateY: 0, opacity: 1, scale: 1 }}
         exit={{ translateY: -100, opacity: 0, scale: 0.9 }}
         transition={{
            type: 'timing',
            duration: 300,
         }}
         style={[
            styles.toastContainer,
            { borderLeftColor: colors.accent }
         ]}
      >
         <View style={styles.toastContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.subtleBg }]}>
               <colors.Icon size={20} color={colors.accent} strokeWidth={2.5} />
            </View>
            <View style={styles.textContainer}>
               <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
               {toast.message ? (
                  <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>
               ) : null}
            </View>
            {!isConfirm && (
               <TouchableOpacity onPress={() => onDismiss(toast.id)} style={styles.closeButton}>
                  <X size={16} color="rgba(255,255,255,0.4)" />
               </TouchableOpacity>
            )}
         </View>

         {isConfirm && (
            <View style={styles.actionButtons}>
               <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                     toast.onCancel?.();
                     onDismiss(toast.id);
                  }}
               >
                  <Text style={styles.cancelButtonText}>{toast.cancelText || 'Cancel'}</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                     toast.onConfirm?.();
                     onDismiss(toast.id);
                  }}
               >
                  <Text style={styles.confirmButtonText}>{toast.confirmText || 'Confirm'}</Text>
               </TouchableOpacity>
            </View>
         )}
      </MotiView>
   );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
   const MAX_TOASTS = 3;
   const [toasts, setToasts] = useState<ToastMessage[]>([]);
   const insets = useSafeAreaInsets();

   const dismissToast = useCallback((id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
   }, []);

   const showToast = useCallback((title: string, message?: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newToast = { id, title, message, type, duration };

      setToasts(prev => {
         if (prev.length >= MAX_TOASTS) {
            setTimeout(() => {
               setToasts([newToast]);
            }, 400);
            return [];
         }
         return [...prev, newToast];
      });
   }, []);

   const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, options?: {
      confirmText?: string;
      cancelText?: string;
      type?: ToastType;
      onCancel?: () => void;
   }) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newToast = {
         id,
         title,
         message,
         type: options?.type || 'warning',
         onConfirm,
         onCancel: options?.onCancel,
         confirmText: options?.confirmText || 'Confirm',
         cancelText: options?.cancelText || 'Cancel',
      };

      setToasts(prev => {
         if (prev.length >= MAX_TOASTS) {
            setTimeout(() => {
               setToasts([newToast]);
            }, 400);
            return [];
         }
         return [...prev, newToast];
      });
   }, []);

   return (
      <ToastContext.Provider value={{ showToast, showConfirm }}>
         {children}
         <View style={[styles.toastWrapper, { top: insets.top + 10 }]} pointerEvents="box-none">
            <AnimatePresence>
               {toasts.map(toast => (
                  <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
               ))}
            </AnimatePresence>
         </View>
      </ToastContext.Provider>
   );
};

export const useToast = () => {
   const context = useContext(ToastContext);
   if (!context) {
      throw new Error('useToast must be used within a ToastProvider');
   }
   return context;
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
   toastWrapper: {
      position: 'absolute',
      left: 16,
      right: 16,
      zIndex: 99999,
      elevation: 99999,
      alignItems: 'center',
      gap: 10,
   },
   toastContainer: {
      width: screenWidth - 32,
      backgroundColor: '#1A1D20',
      borderRadius: 12,
      borderLeftWidth: 4,
      ...Platform.select({
         ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
         },
         android: {
            elevation: 12,
         },
      }),
      overflow: 'hidden',
   },
   toastContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
   },
   iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
   },
   textContainer: {
      flex: 1,
      gap: 2,
   },
   title: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.1,
   },
   message: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
   },
   closeButton: {
      padding: 4,
   },
   actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 10,
   },
   actionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
   },
   cancelButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
   },
   cancelButtonText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: 14,
      fontWeight: '600',
   },
   confirmButton: {
      // Background set dynamically
   },
   confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
   },
});
