export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectCategory =
  | "open_source"
  | "startup"
  | "side_project"
  | "hackathon"
  | "community";

export type ProjectStatus = "draft" | "open" | "in_progress" | "closed";

export type ExecutionType = "idea" | "building" | "launched";

export type ContributorRequestStatus = "pending" | "approved" | "rejected";

export type LinkType = "github" | "linkedin" | "peerlist";

export type NotificationType =
  | "contributor_request"
  | "request_approved"
  | "request_rejected"
  | "feedback"
  | "project_update"
  | "milestone_created"
  | "milestone_completed";

export type MilestoneStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          github_url: string | null;
          linkedin_url: string | null;
          peerlist_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          peerlist_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          github_url?: string | null;
          linkedin_url?: string | null;
          peerlist_url?: string | null;
          updated_at?: string;
        };
      };
      qualifications: {
        Row: {
          id: string;
          user_id: string;
          skill: string;
          level: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          skill: string;
          level: string;
        };
        Update: {
          skill?: string;
          level?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          founder_id: string;
          name: string;
          description: string;
          category: ProjectCategory;
          status: ProjectStatus;
          cover_url: string | null;
          banner_url: string | null;
          start_date: string | null;
          end_date: string | null;
          execution_type: ExecutionType;
          deleted_at: string | null;
          search_vector: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          founder_id: string;
          name: string;
          description: string;
          category: ProjectCategory;
          status?: ProjectStatus;
          cover_url?: string | null;
          banner_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          execution_type?: ExecutionType;
        };
        Update: {
          name?: string;
          description?: string;
          category?: ProjectCategory;
          status?: ProjectStatus;
          cover_url?: string | null;
          banner_url?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          execution_type?: ExecutionType;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          actor_id: string | null;
          project_id: string | null;
          milestone_id: string | null;
          read_status: boolean;
          message: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: NotificationType;
          actor_id?: string | null;
          project_id?: string | null;
          milestone_id?: string | null;
          read_status?: boolean;
          message?: string | null;
        };
        Update: {
          read_status?: boolean;
        };
      };
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: MilestoneStatus;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          title: string;
          description?: string | null;
          status?: MilestoneStatus;
          target_date?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          status?: MilestoneStatus;
          target_date?: string | null;
          updated_at?: string;
        };
      };
      project_analytics: {
        Row: {
          id: string;
          project_id: string;
          view_count: number;
          unique_viewers: number;
          last_viewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          view_count?: number;
          unique_viewers?: number;
          last_viewed_at?: string | null;
        };
        Update: {
          view_count?: number;
          unique_viewers?: number;
          last_viewed_at?: string | null;
          updated_at?: string;
        };
      };
      contributor_roles: {
        Row: {
          id: string;
          project_id: string;
          role: string;
          count: number;
          created_at: string;
        };
        Insert: {
          project_id: string;
          role: string;
          count: number;
        };
        Update: {
          role?: string;
          count?: number;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          status: ContributorRequestStatus;
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role: string;
          status?: ContributorRequestStatus;
        };
        Update: {
          role?: string;
          status?: ContributorRequestStatus;
        };
      };
      contributor_requests: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: string;
          status: ContributorRequestStatus;
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          role: string;
          status?: ContributorRequestStatus;
        };
        Update: {
          status?: ContributorRequestStatus;
        };
      };
      upvotes: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
        };
        Update: never;
      };
      feedback: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          user_id: string;
          content: string;
        };
        Update: {
          content?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          url: string | null;
          activity_summary: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          name: string;
          url?: string | null;
          activity_summary?: Json | null;
        };
        Update: {
          name?: string;
          url?: string | null;
          activity_summary?: Json | null;
          updated_at?: string;
        };
      };
      project_posts: {
        Row: {
          id: string;
          project_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          content: string;
        };
        Update: {
          content?: string;
        };
      };
      project_links: {
        Row: {
          id: string;
          project_id: string;
          type: LinkType;
          url: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          type: LinkType;
          url: string;
        };
        Update: {
          type?: LinkType;
          url?: string;
        };
      };
    };
  };
}
