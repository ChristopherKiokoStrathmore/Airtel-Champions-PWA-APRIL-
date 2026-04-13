import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string, metadata?: Record<string, any>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
}

export function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  loading = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOptions(options);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query)
      );
      setFilteredOptions(filtered);
    }
  }, [searchQuery, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    onChange(option.value, option.metadata);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
    setSearchQuery('');
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Main Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border rounded-lg flex items-center justify-between transition-all ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed opacity-50'
            : 'bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500'
        } ${
          isOpen ? 'border-red-500 ring-2 ring-red-500' : 'border-gray-300'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              Loading...
            </span>
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            placeholder
          )}
        </span>
        <div className="flex items-center gap-2">
          {value && !disabled && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-red-600 transition-colors"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    option.value === value ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-900'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{option.label}</span>
                    {option.metadata && (
                      <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                        {Object.entries(option.metadata).map(([key, val]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {val}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
