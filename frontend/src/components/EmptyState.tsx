// EmptyState.tsx - Beautiful empty states
// Modern illustration-like design

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon = '💬', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      {/* Icon Circle */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 
                      flex items-center justify-center text-5xl backdrop-blur-xl
                      shadow-lg ring-1 ring-gray-200/50 dark:ring-gray-700/50">
          {icon}
        </div>
        <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 
                      rounded-full blur-xl -z-10"></div>
      </div>
      
      {/* Content */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600
                   text-white font-medium rounded-xl transition-all duration-200
                   shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
