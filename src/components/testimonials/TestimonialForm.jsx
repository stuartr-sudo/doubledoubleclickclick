import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, Plus } from "lucide-react";

export default function TestimonialForm({ testimonial, onSubmit, onCancel }) {
  // SAFETY: provide safe defaults for all fields to prevent undefined access
  const safeTestimonial = testimonial && typeof testimonial === "object" ? testimonial : {};
  
  const [formData, setFormData] = useState({
    review_title: safeTestimonial.review_title || "",
    review_comment: safeTestimonial.review_comment || "",
    review_author: safeTestimonial.review_author || "",
    review_star_rating: Number(safeTestimonial.review_star_rating) || 5,
    review_date: safeTestimonial.review_date || "",
    is_verified_purchase: Boolean(safeTestimonial.is_verified_purchase),
    product_title: safeTestimonial.product_title || "",
    source: safeTestimonial.source || "manual",
    images: Array.isArray(safeTestimonial.images) ? [...safeTestimonial.images] : []
  });

  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.review_comment.trim() || !formData.review_author.trim()) {
      return;
    }
    onSubmit(formData);
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, imageUrl.trim()]
      });
      setImageUrl("");
    }
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="review_title">Review Title</Label>
          <Input
            id="review_title"
            value={formData.review_title}
            onChange={(e) => setFormData({...formData, review_title: e.target.value})}
            placeholder="Great product!"
            className="bg-white border-slate-300 text-slate-900"
          />
        </div>

        <div>
          <Label htmlFor="review_author">Author Name *</Label>
          <Input
            id="review_author"
            value={formData.review_author}
            onChange={(e) => setFormData({...formData, review_author: e.target.value})}
            placeholder="John Doe"
            required
            className="bg-white border-slate-300 text-slate-900"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="review_comment">Review Comment *</Label>
        <Textarea
          id="review_comment"
          value={formData.review_comment}
          onChange={(e) => setFormData({...formData, review_comment: e.target.value})}
          placeholder="Write the review content here..."
          rows={4}
          required
          className="bg-white border-slate-300 text-slate-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="review_star_rating">Star Rating</Label>
          <Select 
            value={String(formData.review_star_rating)} 
            onValueChange={(value) => setFormData({...formData, review_star_rating: Number(value)})}
          >
            <SelectTrigger className="bg-white border-slate-300 text-slate-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900">
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="review_date">Review Date</Label>
          <Input
            id="review_date"
            value={formData.review_date}
            onChange={(e) => setFormData({...formData, review_date: e.target.value})}
            placeholder="January 1, 2024"
            className="bg-white border-slate-300 text-slate-900"
          />
        </div>

        <div>
          <Label htmlFor="product_title">Product Title</Label>
          <Input
            id="product_title"
            value={formData.product_title}
            onChange={(e) => setFormData({...formData, product_title: e.target.value})}
            placeholder="Product name"
            className="bg-white border-slate-300 text-slate-900"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_verified_purchase"
          checked={formData.is_verified_purchase}
          onChange={(e) => setFormData({...formData, is_verified_purchase: e.target.checked})}
          className="h-4 w-4"
        />
        <Label htmlFor="is_verified_purchase" className="text-sm">
          Verified Purchase
        </Label>
      </div>

      {/* Images section */}
      <div>
        <Label>Review Images</Label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-white border-slate-300 text-slate-900"
            />
            <Button type="button" onClick={addImage} size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {formData.images.length > 0 && (
            <div className="space-y-2">
              {formData.images.map((img, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                  <img src={img} alt="Review" className="w-12 h-12 object-cover rounded" />
                  <span className="flex-1 text-sm text-slate-600 truncate">{img}</span>
                  <Button 
                    type="button" 
                    onClick={() => removeImage(index)} 
                    size="sm" 
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
          Save Testimonial
        </Button>
      </div>
    </form>
  );
}