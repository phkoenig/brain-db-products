export interface MaterialCategory {
  id: string;
  main_category: string;
  sub_category: string;
  label: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialCategoryCreate {
  id: string;
  main_category: string;
  sub_category: string;
  label: string;
}

export interface MaterialCategoryUpdate {
  main_category?: string;
  sub_category?: string;
  label?: string;
}

export interface MaterialCategoryHierarchy {
  [key: string]: {
    label: string;
    children: {
      [key: string]: string;
    };
  };
} 