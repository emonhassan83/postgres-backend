import { TSendMailBody } from '@/app/@types/system.types';

export const isValidEmailPayload = (
  payload: TSendMailBody
): payload is Required<TSendMailBody> => {
  return Boolean(payload.to && payload.subject && payload.html);
};
