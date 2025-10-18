import React, { useState } from "react";
import { Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
  if (isRunning) return "bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-600 hover:to-blue-800 text-white cursor-not-allowed";
  if (isCompleted) return "bg-gradient-to-b from-emerald-400 to-green-500 hover:from-emerald-400 hover:to-green-500 text-white cursor-not-allowed";
  if (isFailed) return "bg-gradient-to-b from-orange-400 to-amber-600 hover:from-orange-500 hover:to-amber-700 text-white";
  return "bg-gradient-to-b from-pink-400 to-rose-600 hover:from-pink-500 hover:to-rose-700 text-white";
};

  const buttonClass = `h-8 w-8 rounded-md inline-flex items-center justify-center transition-all ${getButtonClass()}`;

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
      
      onStatusChange && onStatusChange(item.id, item.type, "completed");
      setShowModal(false);
      toast.success("Flash workflow completed and saved!");
    } catch (err) {
      console.error("Failed to save flashed content:", err);
      
      if (err?.response?.status === 429) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.");
      } else {
        toast.error("Flash completed but failed to save changes");
      }
      
      onStatusChange && onStatusChange(item.id, item.type, "failed");
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
        {renderIcon()}
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