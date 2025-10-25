import React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react"; // Assuming lucide-react for icons

export default function MiniMultiSelect({ options = [], value = [], onChange, placeholder = "Select...", size = "md", itemVariant = "default" }) {
  const [open, setOpen] = React.useState(false);

  // Derive display label based on selected values
  const selectedLabels = React.useMemo(() => {
    if (!Array.isArray(value) || value.length === 0) {
      return placeholder;
    }

    // Filter options to get selected ones and map their labels
    const labels = options.
    filter((opt) => value.includes(opt.value)).
    map((opt) => opt.label);

    if (labels.length === 0) {
      return placeholder;
    }

    if (labels.length <= 2) {
      return labels.join(", ");
    }

    return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
  }, [value, options, placeholder]);

  const triggerSizeClass = size === "sm" ? "h-8 text-sm px-3" : "h-9 text-sm px-3";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between !bg-white !border-slate-300 !text-slate-900 !hover:bg-slate-50 !focus:ring-2 !focus:ring-indigo-500",
            triggerSizeClass
          )}>

          <span className="truncate">{selectedLabels}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[100] w-[--radix-popover-trigger-width] min-w-[260px] max-w-[calc(100vw-2rem)] p-2 !bg-white !text-slate-900 !border !border-slate-200 shadow-xl max-h-[60vh] overflow-hidden"
        align="start">

        <Command className="!bg-white !text-slate-900">
          <CommandInput
            placeholder="Search..."
            className="placeholder:!text-slate-400 !text-slate-900" />

          <CommandList className="!bg-white !text-slate-900 max-h-[50vh] sm:max-h-64 overflow-auto">
            <CommandEmpty className="!text-slate-500 px-2 py-2">No results found.</CommandEmpty>
            <CommandGroup className="!bg-white px-1">
              {(options || []).map((option) =>
              <CommandItem
                key={option.value} // Use option.value as key
                value={option.value} // Set value for command item search
                className="relative flex cursor-default select-none items-center text-sm outline-none my-1 px-3 py-2 rounded-lg !border !border-slate-200 !bg-white !text-slate-900 hover:!bg-slate-100 data-[highlighted]:!bg-slate-100 data-[selected=true]:!bg-white data-[selected=true]:!text-slate-900 whitespace-normal"

                onSelect={(currentValue) => {
                  const newSelection = new Set(value); // Use Set for efficient add/delete
                  if (newSelection.has(currentValue)) {
                    newSelection.delete(currentValue);
                  } else {
                    newSelection.add(currentValue);
                  }
                  onChange(Array.from(newSelection)); // Convert Set back to Array
                  setOpen(false); // Close the popover on selection
                }}>

                  <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0"
                  )} />

                  <span className="truncate">{option.label}</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>);

}