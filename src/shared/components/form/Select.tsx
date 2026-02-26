import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "../../../shared/icons";
import Badge from "../ui/badge/Badge";

export interface SelectOption {
  value: string;
  label: string;
  badge?: {
    text?: string;
    color?: "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";
  };
}

interface SelectProps {
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
  label?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : internalValue;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (val: string) => {
    setInternalValue(val);
    onChange(val);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0) {
        handleSelect(options[highlightedIndex].value);
      } else {
        setIsOpen(true);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Tab") {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  const selectedOption = options.find((opt) => opt.value === currentValue);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          className={`flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none transition hover:bg-gray-50 focus:border-brand-300 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:border-brand-500 ${
            isOpen
              ? "border-brand-300 ring-4 ring-brand-500/10 dark:border-brand-500"
              : ""
          }`}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
        >
          <span
            className={`block truncate ${
              selectedOption
                ? "text-gray-900 dark:text-white"
                : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {selectedOption ? (
              <div className="flex items-center gap-2">
                <span>{selectedOption.label}</span>
                {selectedOption.badge && (
                  <Badge variant="light" color={selectedOption.badge.color} size="sm">
                    {selectedOption.badge.text}
                  </Badge>
                )}
              </div>
            ) : (
              placeholder
            )}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg bg-white shadow-lg border border-gray-100 dark:bg-gray-700 dark:border-gray-600">
            <ul className="max-h-60 overflow-auto py-1 text-base leading-6 shadow-xs focus:outline-none sm:text-sm">
              {options.map((option, index) => (
                <li
                  key={option.value}
                  className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                    option.value === currentValue
                      ? "bg-brand-50 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100"
                      : "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600"
                  } ${
                    index === highlightedIndex ? "bg-gray-100 dark:bg-gray-600" : ""
                  }`}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span
                    className={`block truncate ${
                      option.value === currentValue ? "font-semibold" : "font-normal"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{option.label}</span>
                      {option.badge && (
                        <Badge variant="light" color={option.badge.color} size="sm">
                          {option.badge.text}
                        </Badge>
                      )}
                    </div>
                  </span>
                </li>
              ))}
              {options.length === 0 && (
                <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No options
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Select;
