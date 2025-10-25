import React, { useState } from "react";
import { Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import FlashTemplateModal from "./FlashTemplateModal";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { toast } from 'sonner';

export default function FlashButton({ item, onStatusChange }) {
  const [showModal, setShowModal] = useState(false);
  const flashStatus = item.flash_status || "idle";
  
  const isRunning = flashStatus === "running";
  const isCompleted = flashStatus === "completed";
  const isFailed = flashStatus === "failed";

  // Helper: Count words in HTML content
  const countWords = (html) => {
    if (!html) return 0;
    // Strip HTML tags and count words
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.split(' ').filter(word => word.length > 0).length;
  };

  const wordCount = countWords(item.content);
  const MIN_WORD_COUNT = 400;

const getButtonClass = () => {
  if (isRunning) return "bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-600 hover:to-blue-800 text-white cursor-not-allowed";
  if (isCompleted) return "bg-gradient-to-b from-emerald-400 to-green-500 hover:from-emerald-400 hover:to-green-500 text-white cursor-not-allowed";
  if (isFailed) return "bg-gradient-to-b from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white";
  return "bg-gradient-to-b from-pink-400 to-rose-600 hover:from-pink-500 hover:to-rose-700 text-white";
};

  const buttonClass = `h-8 w-8 rounded-md inline-flex items-center justify-center transition-all ${getButtonClass()}`;

  const handleClick = (e) => {
    e.stopPropagation();
    
    // Validation 1: Already completed
    if (item.flash_status === "completed") {
      toast.error("This article has already been flashed and cannot be re-flashed");
      return;
    }
    
    // Validation 2: Empty content
    if (!item.content || item.content.trim() === "") {
      toast.error("Cannot flash: Article content is empty");
      return;
    }
    
    // Validation 3: Minimum word count
    if (wordCount < MIN_WORD_COUNT) {
      toast.error(`Cannot flash: Article must be at least ${MIN_WORD_COUNT} words (currently ${wordCount} words)`);
      return;
    }
    
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleTemplateSelect = async (template) => {
    try {
      // Update the item with the selected Flash Template
      const updateData = { flash_template: template };
      
      if (item.type === "post") {
        await BlogPost.update(item.id, updateData);
      } else if (item.type === "webhook") {
        await WebhookReceived.update(item.id, updateData);
      }
      
      setShowModal(false);
      
      if (template === "None") {
        toast.success("Flash template removed.");
      } else {
        toast.success(`Flash template set to: ${template}`);
      }
    } catch (err) {
      console.error("Failed to save flash template:", err);
      
      if (err?.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        toast.error("Failed to save flash template");
      }
    }
  };

  // Render different icons based on flash status
  const renderIcon = () => {
    if (isRunning) {
      return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    }
    if (isCompleted) {
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
    if (isFailed) {
      return <AlertCircle className="w-3.5 h-3.5" />;
    }
    return <Zap className="w-3.5 h-3.5" />;
  };

  // Format flashed_at timestamp for tooltip
  const getTooltipText = () => {
    if (isCompleted && item.flashed_at) {
      const flashedDate = new Date(item.flashed_at);
      return `Flashed on ${flashedDate.toLocaleDateString()} at ${flashedDate.toLocaleTimeString()}`;
    }
    if (isCompleted) {
      return "Already flashed (cannot re-flash)";
    }
    if (isRunning) {
      return "Flash in progress...";
    }
    if (isFailed) {
      return "Flash failed - click to retry";
    }
    if (wordCount < MIN_WORD_COUNT) {
      return `Content too short (${wordCount}/${MIN_WORD_COUNT} words)`;
    }
    return "Run flash workflow";
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={item.flash_status === "running" || item.flash_status === "completed"}
        className={buttonClass}
        title={getTooltipText()}
      >
        {renderIcon()}
      </button>

      {showModal && (
        <FlashTemplateModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSelect={handleTemplateSelect}
          currentTemplate={item.flash_template || "None"}
        />
      )}
    </>
  );
}