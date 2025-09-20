import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Using a simplified multi-select for the light theme update
export default function UsernameFilter({ allowedUsernames = [], value = [], onChange }) {
  const [open, setOpen] = React.useState(false);

  const options = (allowedUsernames || []).map((u) => ({ label: u, value: u }));

  const selectedLabels = value.length === 0 ? "Select username(s)..." :
  value.length > 2 ? `${value.length} selected` :
  value.join(', ');

  return (
    <div className="space-y-2">
      <Label className="text-sm text-slate-700 font-medium">Filter by Username</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white border-slate-300 text-slate-900">

            <span className="truncate">{selectedLabels}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white">
          <Command className="bg-slate-50 text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md">
            <CommandInput placeholder="Search usernames..." />
            <CommandList>
              <CommandEmpty>No usernames found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) =>
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const newSelection = new Set(value);
                    if (newSelection.has(currentValue)) {
                      newSelection.delete(currentValue);
                    } else {
                      newSelection.add(currentValue);
                    }
                    onChange(Array.from(newSelection));
                  }}>

                    <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value) ? "opacity-100" : "opacity-0"
                    )} />

                    {option.label}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-slate-500">Only your assigned usernames are available unless you are an admin.</p>
    </div>);

}