export interface AuthResponse {
   token: string;
   user: {
      id: string;
      email: string;
      name: string;
      createdAt?: string;
      updatedAt?: string;
   };
}

export interface UserProfile {
   id: string;
   email: string;
   name: string;
   activeBusinessPlanId?: string;
   createdAt: string;
   updatedAt: string;
}

export interface UserWithPlans extends UserProfile {
   businessPlans: Array<{
      id: string;
      businessName: string;
      place: string;
      idea: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
   }>;
}