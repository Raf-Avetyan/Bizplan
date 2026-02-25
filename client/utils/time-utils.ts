import { formatDistanceToNow } from 'date-fns';

export const getTimeAgo = (date: string | Date): string => {
   try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;

      if (isNaN(dateObj.getTime())) {
         return 'Invalid date';
      }

      return formatDistanceToNow(dateObj, { addSuffix: true });
   } catch (error) {
      return 'recently';
   }
};

export const getRelativeTime = (date: string | Date): string => {
   const dateObj = typeof date === 'string' ? new Date(date) : date;
   const now = new Date();
   const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

   if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
   }

   const diffInMinutes = Math.floor(diffInSeconds / 60);
   if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
   }

   const diffInHours = Math.floor(diffInMinutes / 60);
   if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
   }

   const diffInDays = Math.floor(diffInHours / 24);
   if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
   }

   const diffInMonths = Math.floor(diffInDays / 30);
   if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
   }

   const diffInYears = Math.floor(diffInMonths / 12);
   return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};