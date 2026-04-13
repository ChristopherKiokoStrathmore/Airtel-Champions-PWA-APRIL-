interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="p-8">
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center max-w-md mx-auto">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Data</h3>
        <p className="text-red-700 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ 
  icon = '📭', 
  title = 'No Data', 
  message = 'No data available at the moment',
  action
}: {
  icon?: string;
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2 bg-[#E60000] text-white rounded-lg hover:bg-[#CC0000] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
