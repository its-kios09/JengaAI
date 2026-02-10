import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchInferenceModels, predict } from '@/api/inference.ts';

export function useInferenceModels() {
  return useQuery({ queryKey: ['inference-models'], queryFn: fetchInferenceModels });
}

export function usePredict() {
  return useMutation({
    mutationFn: ({ modelId, text }: { modelId: string; text: string }) => predict(modelId, text),
  });
}
