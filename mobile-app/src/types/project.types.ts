export interface ProjectCategory {
  id: string;
  name: string;
  icon: string;
  projectCount: number;
}

export interface Project {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  techStack: string[];
  price: number;
  rating: number;
  reviewCount: number;
  thumbnailUrl: string | null;
  isPremium: boolean;
  isBestSeller: boolean;
  salesCount: number;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  description: string;
  images: string[];
  videoUrl: string | null;
  liveDemoUrl: string | null;
  sourceCodeSizeMB: number;
  documentationSizeMB: number;
  platformFeePercent: number;
  isWishlisted: boolean;
}

export interface ProjectFilters {
  categoryId: string | null;
  minPrice: number;
  maxPrice: number;
  minRating: number | null;
  technologies: string[];
  sortBy: "relevance" | "latest" | "price";
}

export const DEFAULT_PROJECT_FILTERS: ProjectFilters = {
  categoryId: null,
  minPrice: 0,
  maxPrice: 1000,
  minRating: null,
  technologies: [],
  sortBy: "relevance",
};
