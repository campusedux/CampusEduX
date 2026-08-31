/** Fixture rows for the `projects` / `categories` / `reviews` tables, shaped
 *  exactly as PostgREST returns them (snake_case, embedded resources). */

export const categoryRows = [
  { id: "web-development", name: "Web Development", icon: "globe-outline", project_count: 1200 },
  { id: "mobile-development", name: "Mobile Development", icon: "phone-portrait-outline", project_count: 850 },
];

export const projectRow = {
  id: "tr-1",
  title: "E-Commerce Website",
  category_id: "web-development",
  category: { name: "Web Development" },
  tech_stack: ["React", "Node.js", "MongoDB"],
  price: 499,
  rating: 4.6,
  review_count: 122,
  thumbnail_url: null,
  is_premium: false,
  is_best_seller: true,
  sales_count: 244,
  created_at: "2025-05-01T00:00:00.000Z",
};

export const projectDetailRow = {
  ...projectRow,
  description: "A complete e-commerce website.",
  images: [],
  video_url: null,
  live_demo_url: "https://demo.campusedux.app/ecommerce",
  source_code_size_mb: 45.6,
  documentation_size_mb: 2.7,
  platform_fee_percent: 2,
};

export const projectRows = [
  projectRow,
  {
    ...projectRow,
    id: "pr-3",
    title: "AI Chat Application",
    category_id: "machine-learning",
    category: { name: "Machine Learning" },
    tech_stack: ["Python", "FastAPI", "React"],
    price: 599,
    is_premium: true,
    is_best_seller: false,
  },
];

export const reviewRows = [
  {
    id: "rv-1",
    project_id: "tr-1",
    user_id: "u-1",
    rating: 5,
    comment: "Great project!",
    created_at: "2025-05-20T00:00:00.000Z",
    profile: { full_name: "Rahul Sharma", avatar_url: null },
  },
  {
    id: "rv-2",
    project_id: "tr-1",
    user_id: "u-2",
    rating: 4,
    comment: "Nice work.",
    created_at: "2025-05-18T00:00:00.000Z",
    profile: { full_name: "Priya Verma", avatar_url: null },
  },
];

export const purchaseRow = {
  id: "d1000000-0000-0000-0000-000000001001",
  user_id: "u-1",
  project_id: "tr-1",
  status: "success",
  price: 499,
  platform_fee: 9.98,
  discount: 0,
  total_amount: 508.98,
  razorpay_order_id: "order_test",
  razorpay_payment_id: null,
  failure_reason: null,
  created_at: "2025-05-25T00:00:00.000Z",
  project: { title: "E-Commerce Website" },
};
