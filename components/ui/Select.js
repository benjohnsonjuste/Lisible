// components/ui/Select.jsx
import React, { useState, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

const Select = forwardRef(
  (
    {
      id,
      className,
      options = [],
      value = null,
      onChange,
      placeholder = "Sélectionnez une option",
      multiple = false,
      searchable = false,
      disabled = false,
      required = false,
      clearable = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    // Filtrage des options si recherche activée
    const filteredOptions =
      searchable && searchTerm
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : options;

    // Retourne la valeur affichée selon single/multiple
    const getSelectedDisplay = () => {
      if (!value) return placeholder;
      if (multiple) {
        const selected = options.filter((opt) => value.includes(opt.value));
        return selected.map((opt) => opt.label).join(", ") || placeholder;
      }
      const selectedOption = options.find((opt) => opt.value === value);
      return selectedOption?.label || placeholder;
    };

    const handleToggle = () => setIsOpen(!isOpen);

    const handleOptionSelect = (optionValue) => {
      let newValue;
      if (multiple) {
        if (value?.includes(optionValue)) {
          newValue = value.filter((v) => v !== optionValue);
        } else {
          newValue = [...(value || []), optionValue];
        }
      } else {
        newValue = optionValue;
        setIsOpen(false);
      }
      onChange && onChange(newValue);
    };

    return (
      <div className={cn("relative w-full", className)} ref={ref}>
        <button
          type="button"
          className={cn(
            "w-full text-left px-3 py-2 border rounded-md bg-white flex justify-between items-center",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleToggle}
          disabled={disabled}
        >
          <span className="truncate">{getSelectedDisplay()}</span>
          <ChevronDown size={20} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 border rounded-md bg-white shadow-lg max-h-60 overflow-auto">
            {searchable && (
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border-b focus:outline-none"
              />
            )}
            {filteredOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "px-3 py-2 cursor-pointer hover:bg-gray-100",
                  multiple &&
                    value?.includes(option.value) &&
                    "bg-gray-200 font-medium"
                )}
                onClick={() => handleOptionSelect(option.value)}
              >
                {option.label}
              </div>
            ))}
            {clearable && (
              <div
                className="px-3 py-2 cursor-pointer text-red-500 hover:bg-gray-100"
                onClick={() => onChange(multiple ? [] : null)}
              >
                Effacer la sélection
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;