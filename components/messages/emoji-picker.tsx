"use client";

interface EmojiPickerProps {
  isOpen: boolean;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ isOpen, onEmojiSelect, onClose }: EmojiPickerProps) {
  const popularEmojis = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', 
    '❤️', '🔥', '💯', '🎉', '👏', '🙌', '😊', '😘', '🤗', '😴', 
    '🤤', '😋', '🥳', '😇', '🤩', '😏', '😌', '😔', '😕', '😤', 
    '😭', '🤯', '😱', '😨', '😰', '😳', '🤪', '😜', '😝', '🤨', 
    '🧐', '🤓', '😎', '🤠', '🥸', '😷', '🤒', '🤕', '🤢', '🤮', 
    '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤩', '🥰', 
    '😍', '🤗', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', 
    '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', 
    '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', 
    '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', 
    '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', 
    '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', 
    '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', 
    '😽', '🙀', '😿', '😾'
  ];

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full right-0 mb-2 w-80 p-4 bg-white/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl z-50">
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-900 mb-3">
          Choose an emoji
        </h4>
        
        {/* Popular Emojis */}
        <div className="grid grid-cols-8 gap-2">
          {popularEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
