import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Company, CompanyAdditionalDataDto, CreateCompanyDto } from '@/types/company.types';
import { companyService } from '@/services/company.service';

export const useActiveCompany = () => {
   return useQuery({
      queryKey: ['activeCompany'],
      queryFn: () => companyService.getActive() as unknown as Company,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
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

export const useCreateCompany = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (data: CreateCompanyDto) => companyService.create(data),
      onSuccess: async (newPlan: Company) => {
         await companyService.setActive(newPlan.id);

         queryClient.setQueryData(['activeCompany'], newPlan);
         queryClient.invalidateQueries({ queryKey: ['activeCompany'] });

         return newPlan;
      },
   });
};
export const useUpdateCompanyAdditionalData = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ companyId, data }: { companyId: string; data: any }) =>
         companyService.updateAdditionalDataKey(companyId, 'business_plan', data),
      onSuccess: (updatedData, variables) => {
         queryClient.setQueryData(
            ['companyAdditionalData', variables.companyId],
            updatedData
         );

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
         companyService.addAdditionalDataKey(companyId, 'business_plan', data),
      onSuccess: (updatedData, variables) => {
         queryClient.setQueryData(
            ['companyAdditionalData', variables.companyId],
            updatedData
         );

         queryClient.invalidateQueries({
            queryKey: ['companyAdditionalData', variables.companyId]
         });

         queryClient.invalidateQueries({
            queryKey: ['activeCompany']
         });
      },
   });
};