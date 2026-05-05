type PageBlockType =
   | 'heading'
   | 'paragraph'
   | 'list'
   | 'table'
   | 'image'
   | 'chart'
   | 'divider'
   | 'quote';

type PageType = 'cover' | 'toc' | 'content' | 'financial' | 'custom';

type BackendPageBlock = {
   id: string;
   type: PageBlockType;
   content: string | any[];
   styles: Record<string, any>;
   metadata?: Record<string, any>;
};

type BackendPage = {
   id: string;
   pageNumber: number;
   type: PageType;
   title: string;
   section: string;
   blocks: BackendPageBlock[];
   styles: Record<string, any>;
   formatting: {
      backgroundColor: string;
      backgroundImage?: string;
      border?: string;
      shadow?: string;
   };
};