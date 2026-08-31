// re-declared here to avoid a circular import with project.types in editors
// that resolve barrel files eagerly; re-exported from the barrel below.
import type { Project } from "./project.types";

export interface Review {
  id: string;
  projectId: string;
  userName: string;
  userAvatarUrl: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RatingBreakdown {
  average: number;
  totalReviews: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
}

export type OrderStatus = "pending" | "success" | "failed";

export interface PurchaseOrder {
  id: string;
  projectId: string;
  projectTitle: string;
  price: number;
  platformFee: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface PurchasedProject {
  orderId: string;
  project: Project;
  purchasedAt: string;
}

export interface DownloadRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  fileLabel: string;
  fileSizeMB: number;
  downloadedAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  category: "main" | "documentation";
  label: string;
  fileName: string;
  sizeMB: number;
  url: string;
}

export interface ProjectVersionChange {
  version: string;
  isLatest: boolean;
  releasedAt: string;
  sizeMB: number;
  changelog: string[];
}

export interface OwnedProjectDetail {
  orderId: string;
  project: Project;
  purchasedAt: string;
  license: string;
  developerName: string;
  purchasedVersion: string;
  latestVersion: string;
  isUpdateAvailable: boolean;
  githubUrl: string | null;
  repo: {
    owner: string;
    name: string;
    language: string;
    stars: number;
    forks: number;
    updatedAt: string;
  } | null;
}
