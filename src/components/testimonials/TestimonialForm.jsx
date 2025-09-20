import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export default function TestimonialForm({ value, onChange, usernames = [] }) {
  const handleChange = (field, val) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Label htmlFor="review_author">Author Name</Label>
        <Input
          id="review_author"
          value={value.review_author || ''}
          onChange={(e) => handleChange('review_author', e.target.value)}
          placeholder="e.g., Jane Doe"
          className="bg-white border-slate-300 text-slate-900 mt-1"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="review_title">Review Title (optional)</Label>
        <Input
          id="review_title"
          value={value.review_title || ''}
          onChange={(e) => handleChange('review_title', e.target.value)}
          placeholder="e.g., Fantastic Product!"
          className="bg-white border-slate-300 text-slate-900 mt-1"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="review_comment">Review Comment</Label>
        <Textarea
          id="review_comment"
          value={value.review_comment || ''}
          onChange={(e) => handleChange('review_comment', e.target.value)}
          placeholder="Enter the full review text here..."
          className="bg-white border-slate-300 text-slate-900 mt-1 min-h-[100px]"
        />
      </div>
      <div>
        <Label htmlFor="review_star_rating">Star Rating</Label>
        <Select
          value={String(value.review_star_rating || '5')}
          onValueChange={(val) => handleChange('review_star_rating', Number(val))}
        >
          <SelectTrigger className="bg-white border-slate-300 text-slate-900 mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 text-slate-900">
            {[5, 4, 3, 2, 1].map(n => (
              <SelectItem key={n} value={String(n)}>{'★'.repeat(n)}{'☆'.repeat(5 - n)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="review_date">Review Date</Label>
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal bg-white border-slate-300 text-slate-900 mt-1 hover:bg-slate-50"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value.review_date ? format(new Date(value.review_date), "PPP") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
                <Calendar
                    mode="single"
                    selected={value.review_date ? new Date(value.review_date) : undefined}
                    onSelect={(date) => handleChange('review_date', date ? date.toISOString().split('T')[0] : '')}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
      </div>
      {usernames && usernames.length > 0 && (
        <div>
            <Label htmlFor="user_name">Username (optional)</Label>
            <Select
                value={value.user_name || ""}
                onValueChange={(val) => handleChange("user_name", val)}
            >
                <SelectTrigger className="bg-white border-slate-300 text-slate-900 mt-1">
                    <SelectValue placeholder="Assign to a username" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200 text-slate-900">
                    <SelectItem value={null}>None</SelectItem>
                    {usernames.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      )}
      <div className="flex items-center space-x-2 pt-6">
        <Checkbox
          id="is_verified_purchase"
          checked={!!value.is_verified_purchase}
          onCheckedChange={(checked) => handleChange('is_verified_purchase', checked)}
        />
        <Label htmlFor="is_verified_purchase" className="text-sm font-medium leading-none">
          Verified Purchase
        </Label>
      </div>
    </div>
  );
}