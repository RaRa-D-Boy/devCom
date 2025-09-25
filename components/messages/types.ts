export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  cover_image_url?: string;
  bio?: string;
  status?: "active" | "busy" | "offline" | "inactive" | "away";
  role?: string;
  position?: "junior" | "mid" | "senior" | "principal" | "manager" | "cto" | "cfo" | "lead" | "architect" | "director" | "vp" | "founder" | "consultant" | "freelancer" | "intern" | "student";
  company?: string;
  location?: string;
  website?: string;
  github_url?: string;
  gitlab_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  skills?: string[];
  programming_languages?: string[];
  frameworks?: string[];
  tools?: string[];
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  friend_id: string;
  friend: Profile;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender: Profile;
  // New fields for advanced features
  edited_at?: string;
  is_edited?: boolean;
  is_deleted?: boolean;
  deleted_at?: string;
  reply_to_id?: string;
  original_content?: string;
  // Media fields
  media_urls?: string[];
  media_types?: string[];
  media_sizes?: number[];
  media_names?: string[];
  message_type?:
    | "text"
    | "image"
    | "video"
    | "audio"
    | "document"
    | "gif"
    | "mixed";
  // Reply information
  reply_to_content?: string;
  reply_to_sender_id?: string;
  reply_to_created_at?: string;
  reply_to_username?: string;
  reply_to_full_name?: string;
}
