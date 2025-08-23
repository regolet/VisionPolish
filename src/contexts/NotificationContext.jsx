import { createContext, useContext, useState } from 'react'
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (message, type = 'success', duration = 2000) => {
    const id = Date.now() + Math.random()
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
      duration
    }

    setNotifications(prev => [...prev, notification])

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id)
    }, duration)

    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const showSuccess = (message, duration = 2000) => addNotification(message, 'success', duration)
  const showError = (message, duration = 4000) => addNotification(message, 'error', duration)
  const showInfo = (message, duration = 3000) => addNotification(message, 'info', duration)
  const showWarning = (message, duration = 3000) => addNotification(message, 'warning', duration)

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTextColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      case 'info':
        return 'text-blue-800'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showInfo,
      showWarning,
      addNotification,
      removeNotification
    }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              flex items-center p-3 rounded-lg border shadow-lg max-w-sm
              transform transition-all duration-300 ease-in-out
              animate-in slide-in-from-right-full
              ${getBackgroundColor(notification.type)}
            `}
          >
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            <div className={`ml-3 flex-1 text-sm font-medium ${getTextColor(notification.type)}`}>
              {notification.message}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={`ml-2 flex-shrink-0 hover:opacity-70 transition-opacity ${getTextColor(notification.type)}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}