export interface Slug {
  _type?: 'slug';
  current: string;
}

export interface SanityImageAsset {
  _ref: string;
  _type: 'reference';
}

export interface SanityImage {
  _type: 'image';
  asset: SanityImageAsset;
  alt?: string;
  caption?: string;
}

export interface Author {
  _id: string;
  name: string;
  slug?: string;
  image?: SanityImage;
  bio?: string | PortableTextBlock[];
}

export interface Category {
  _id: string;
  title: string;
  slug: string;
  description?: string;
}

export interface PortableTextChild {
  _key?: string;
  _type: 'span' | string;
  text: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _key?: string;
  _type: 'block' | string;
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'blockquote';
  children: PortableTextChild[];
  markDefs?: Array<{
    _key: string;
    _type: string;
    href?: string;
  }>;
  listItem?: 'bullet' | 'number';
  level?: number;
}

/**
 * Interface que espelha exatamente a estrutura nativa do schema 'post' no Sanity
 */
export interface RawSanityPost {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: 'post';
  _updatedAt: string;
  author?: {
    _ref: string;
    _type: 'reference';
  };
  body?: PortableTextBlock[];
  categories?: Array<{
    _ref: string;
    _type: 'reference';
  }>;
  mainImage?: SanityImage;
  publishedAt: string;
  enrollmentEndDate?: string;
  examDate?: string;
  slug: Slug;
  title: string;
}

/**
 * Interface tratada para consumo no frontend (após expansão via projeção GROQ)
 */
export interface Post {
  _id: string;
  _createdAt: string;
  _updatedAt?: string;
  _type: 'post';
  title: string;
  slug: string;
  publishedAt: string;
  enrollmentEndDate?: string;
  examDate?: string;
  isExpired?: boolean;
  statusLabel?: string;
  mainImage?: SanityImage;
  excerpt?: string;
  author?: Author;
  categories?: Category[];
  body?: PortableTextBlock[];
}
