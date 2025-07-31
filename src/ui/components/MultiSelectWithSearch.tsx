"use client";

import React, { useState, useMemo } from "react";
import * as SubframeUtils from "../utils";
import { FeatherSearch, FeatherX, FeatherChevronDown } from "@subframe/core";
import { TextField } from "./TextField";
import { Button } from "./Button";

interface MultiSelectOption {
  id: string;
  label: string;
  group?: string;
}

interface MultiSelectWithSearchProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (selectedValues: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  variant?: "outline" | "filled";
  disabled?: boolean;
}

export const MultiSelectWithSearch = React.forwardRef<
  HTMLDivElement,
  MultiSelectWithSearchProps
>(function MultiSelectWithSearch(
  {
    options,
    selectedValues,
    onSelectionChange,
    placeholder = "Kategorien auswählen...",
    searchPlaceholder = "Kategorien durchsuchen...",
    className,
    variant = "filled",
    disabled = false,
    ...otherProps
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.group && option.group.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm]);

  // Group filtered options
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: MultiSelectOption[] } = {};
    filteredOptions.forEach(option => {
      const groupName = option.group || "Andere";
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(option);
    });
    return groups;
  }, [filteredOptions]);

  const selectedOptions = useMemo(() => {
    return options.filter(option => selectedValues.includes(option.id));
  }, [options, selectedValues]);

  const handleToggleOption = (optionId: string) => {
    if (selectedValues.includes(optionId)) {
      onSelectionChange(selectedValues.filter(id => id !== optionId));
    } else {
      onSelectionChange([...selectedValues, optionId]);
    }
  };

  const handleRemoveOption = (optionId: string) => {
    onSelectionChange(selectedValues.filter(id => id !== optionId));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div
      className={SubframeUtils.twClassNames(
        "relative w-full",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      {/* Selected values display */}
      <div
        className={SubframeUtils.twClassNames(
          "flex min-h-8 w-full flex-wrap items-center gap-1 rounded-md border border-solid border-neutral-border bg-default-background px-3 py-2 cursor-pointer",
          {
            "border border-solid border-neutral-100 bg-neutral-100 hover:border-neutral-border hover:bg-neutral-100":
              variant === "filled",
            "bg-neutral-200 cursor-not-allowed": disabled,
          }
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0 ? (
          <>
            {selectedOptions.map(option => (
              <div
                key={option.id}
                className="flex items-center gap-1 bg-brand-50 text-brand-700 px-2 py-1 rounded-md text-caption font-caption"
              >
                <span>{option.label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOption(option.id);
                  }}
                  className="text-brand-500 hover:text-brand-700"
                >
                  <FeatherX className="w-3 h-3" />
                </button>
              </div>
            ))}
            {selectedOptions.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-neutral-500 hover:text-neutral-700 text-caption font-caption ml-2"
              >
                Alle entfernen
              </button>
            )}
          </>
        ) : (
          <span className="text-subtext-color text-body font-body">
            {placeholder}
          </span>
        )}
        <div className="ml-auto">
          <FeatherChevronDown 
            className={SubframeUtils.twClassNames(
              "text-body font-body text-subtext-color transition-transform",
              { "rotate-180": isOpen }
            )} 
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-solid border-neutral-border bg-white shadow-lg">
          {/* Search field */}
          <div className="p-3 border-b border-neutral-border">
            <TextField
              className="w-full"
              variant="outline"
              icon={<FeatherSearch />}
            >
              <TextField.Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </TextField>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-y-auto p-1">
            {Object.keys(groupedOptions).length > 0 ? (
              Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                <div key={groupName} className="mb-2">
                  <div className="px-3 py-1">
                    <span className="text-caption-bold font-caption-bold text-subtext-color">
                      {groupName}
                    </span>
                  </div>
                  {groupOptions.map(option => (
                    <div
                      key={option.id}
                      className={SubframeUtils.twClassNames(
                        "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-neutral-100 rounded-md mx-1",
                        {
                          "bg-brand-50 text-brand-700": selectedValues.includes(option.id)
                        }
                      )}
                      onClick={() => handleToggleOption(option.id)}
                    >
                      <div
                        className={SubframeUtils.twClassNames(
                          "w-4 h-4 border border-solid border-neutral-300 rounded flex items-center justify-center",
                          {
                            "bg-brand-600 border-brand-600": selectedValues.includes(option.id)
                          }
                        )}
                      >
                        {selectedValues.includes(option.id) && (
                          <FeatherX className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="text-body font-body">
                        {option.label}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-subtext-color">
                Keine Kategorien gefunden
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
});