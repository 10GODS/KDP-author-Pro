export interface Book {
  id: string;
  title: string;
  author: string;
  cover_image?: string;
  created_at: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  content: string;
  order_index: number;
}
