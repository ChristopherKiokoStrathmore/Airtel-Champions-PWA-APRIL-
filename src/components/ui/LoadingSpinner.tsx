export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-[#E60000] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 text-center">
        <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-[#E60000] rounded-full animate-spin mb-4"></div>
        <p className="text-gray-900 font-medium">Processing...</p>
      </div>
    </div>
  );
}
