
import React, { useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import RunWorkflowModal from "../editor/RunWorkflowModal";
import { BlogPost } from "@/api/entities";
import { WebhookReceived } from "@/api/entities";
import { toast } from 'sonner';

export default function FlashButton({ item, onStatusChange }) {
  const [showModal, setShowModal] = useState(false);
  const flashStatus = item.flash_status || "idle";
  
  const isRunning = flashStatus === "running";
  const isCompleted = flashStatus === "completed";
  const isFailed = flashStatus === "failed";

  const getButtonClass = () => {
    if (isRunning) return "bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-500 hover:to-purple-500 text-white cursor-not-allowed";
    if (isCompleted) return "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-500 hover:to-green-600 text-white cursor-not-allowed";
    if (isFailed) return "bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white";
    return "bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600 text-white";
  };

  const buttonClass = `h-10 w-10 rounded-md inline-flex items-center justify-center ${getButtonClass()}`;

  const handleClick = (e) => {
    e.stopPropagation();
    if (item.flash_status === "completed") return;
    if (!item.content || item.content.trim() === "") {
      toast.error("Cannot flash: Article content is empty");
      return;
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  // FIX: pass item context so parent can update the correct row immediately
  const handleWorkflowStart = () => {
    onStatusChange && onStatusChange(item.id, item.type, "running");
    setShowModal(false);
  };

  const handleApply = async (updatedHtml, seoData, schemaData) => {
    try {
      const updateData = { content: updatedHtml };
      if (seoData) {
        Object.assign(updateData, {
          meta_title: seoData.meta_title,
          slug: seoData.slug,
          meta_description: seoData.meta_description,
          focus_keyword: seoData.focus_keyword,
          featured_image: seoData.featured_image,
          tags: seoData.tags,
          excerpt: seoData.excerpt
        });
      }
      if (schemaData) {
        updateData.generated_llm_schema = schemaData;
      }
      
      if (item.type === "post") {
        await BlogPost.update(item.id, updateData);
      } else if (item.type === "webhook") {
        await WebhookReceived.update(item.id, updateData);
      }
      
      // FIX: notify parent with correct identifiers so UI shows "completed"
      onStatusChange && onStatusChange(item.id, item.type, "completed");
      setShowModal(false);
      toast.success("Flash workflow completed and saved!"); // NEW: Success toast
    } catch (err) {
      console.error("Failed to save flashed content:", err);
      
      // NEW: More specific error messages for rate limiting
      if (err?.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        toast.error("Flash completed but failed to save changes");
      }
      
      // Make sure UI reflects failure state
      onStatusChange && onStatusChange(item.id, item.type, "failed");
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={item.flash_status === "running" || item.flash_status === "completed"}
        className={buttonClass}
        title={
          item.flash_status === "completed" 
            ? "Already flashed" 
            : item.flash_status === "running"
            ? "Flash in progress"
            : item.flash_status === "failed"
            ? "Flash failed - click to retry"
            : "Run flash workflow"
        }
      >
        {item.flash_status === "running" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Zap className="w-4 h-4" />
        )}
      </button>

      {showModal && (
        <RunWorkflowModal
          isOpen={showModal}
          onClose={handleModalClose}
          currentHtml={item.content || ""}
          onApply={handleApply}
          onWorkflowStart={handleWorkflowStart}
          userName={item.user_name}
          itemId={item.id}
          itemType={item.type}
          backgroundMode={true}
        />
      )}
    </>
  );
}
