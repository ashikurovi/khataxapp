"use client";

import React from "react";
import Select, { StylesConfig, GroupBase, OptionsOrGroups } from "react-select";
import { cn } from "@/lib/utils";

export interface ReactSelectOption {
  value: string | number;
  label: string;
}

export interface ReactSelectProps {
  options: OptionsOrGroups<ReactSelectOption, GroupBase<ReactSelectOption>>;
  value?: ReactSelectOption | null;
  onChange?: (option: ReactSelectOption | null) => void;
  placeholder?: string;
  isSearchable?: boolean;
  isDisabled?: boolean;
  className?: string;
  name?: string;
}

const customStyles: StylesConfig<ReactSelectOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: "40px",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
    boxShadow: state.isFocused ? "0 0 0 2px hsl(var(--ring))" : "none",
    "&:hover": {
      borderColor: "hsl(var(--ring))",
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
      ? "hsl(var(--accent))"
      : "transparent",
    color: state.isSelected
      ? "hsl(var(--primary-foreground))"
      : "hsl(var(--foreground))",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "hsl(var(--primary))",
      color: "hsl(var(--primary-foreground))",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
};

export function ReactSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isSearchable = true,
  isDisabled = false,
  className,
  name,
}: ReactSelectProps) {
  return (
    <Select<ReactSelectOption, false>
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      name={name}
      className={cn("react-select-container", className)}
      classNamePrefix="react-select"
      styles={customStyles}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: "hsl(var(--primary))",
          primary75: "hsl(var(--primary) / 0.75)",
          primary50: "hsl(var(--primary) / 0.5)",
          primary25: "hsl(var(--primary) / 0.25)",
        },
      })}
    />
  );
}
