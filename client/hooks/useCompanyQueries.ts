import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Company, CompanyAdditionalDataDto, CreateCompanyDto } from '@/types/company.types';
import { companyService } from '@/services/company.service';

export const useActiveCompany = () => {
   return useQuery({
      queryKey: ['activeCompany'],
      queryFn: () => companyService.getActive(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
   });
};

export const useCompanies = () => {
   return useQuery({
      queryKey: ['companies'],
      queryFn: () => companyService.getAll(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: true,
   });
};

export const useSearchCompanies = (searchTerm: string) => {
   return useQuery({
      queryKey: ['companies', 'search', searchTerm],
      queryFn: () => companyService.search(searchTerm),
      enabled: searchTerm.trim().length > 0,
      staleTime: 1000 * 30,
   });
};

export const useCompanyAdditionalData = (planId?: string) => {
   return useQuery({
      queryKey: ['companyAdditionalData', planId],
      queryFn: () => {
         if (!planId) throw new Error('No plan ID');
         return companyService.getAdditionalData(planId) as unknown as CompanyAdditionalDataDto;
      },
      enabled: !!planId,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: true,
   });
};

export const useCreateCompany = (onCreated?: () => void) => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (data: CreateCompanyDto) => companyService.create(data),
      onSuccess: async (newPlan: Company) => {
         await companyService.setActive(newPlan.id);

         if (onCreated) {
            onCreated();
         }

         queryClient.setQueryData(['activeCompany'], newPlan);
         queryClient.invalidateQueries({ queryKey: ['activeCompany'] });
         queryClient.invalidateQueries({ queryKey: ['companies'] });
         queryClient.invalidateQueries({ queryKey: ['companyAdditionalData'] });

         return newPlan;
      },
   });
};

export const useSetActiveCompany = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (companyId: string) => companyService.setActive(companyId),
      onSuccess: (company) => {
         queryClient.setQueryData(['activeCompany'], company);
         queryClient.invalidateQueries({ queryKey: ['activeCompany'] });
         queryClient.invalidateQueries({ queryKey: ['companies'] });
         queryClient.invalidateQueries({ queryKey: ['companyAdditionalData'] });
      },
   });
};

export const useDeleteCompany = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (companyId: string) => companyService.delete(companyId),
      onSuccess: async () => {
         queryClient.invalidateQueries({ queryKey: ['companies'] });
         queryClient.invalidateQueries({ queryKey: ['activeCompany'] });
         queryClient.invalidateQueries({ queryKey: ['companyAdditionalData'] });
      },
   });
};
export const useUpdateCompanyAdditionalData = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ companyId, data }: { companyId: string; data: any }) =>
         companyService.setAdditionalDataValue(companyId, 'business_plan', data),
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({
            queryKey: ['companyAdditionalData', variables.companyId]
         });

         queryClient.invalidateQueries({
            queryKey: ['activeCompany']
         });
      },
   });
};

export const useAddBusinessPlan = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ companyId, data }: { companyId: string; data: any }) =>
         companyService.saveBusinessPlanData(companyId, data),
      onSuccess: (_, variables) => {
         queryClient.invalidateQueries({
            queryKey: ['companyAdditionalData', variables.companyId]
         });

         queryClient.invalidateQueries({
            queryKey: ['activeCompany']
         });
      },
   });
};
