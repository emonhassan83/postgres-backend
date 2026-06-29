import { IErrorMessage } from '@/app/@types/system.types';

const handleValidationError = (error: any, traceId?: string) => {
  const errorMessages: IErrorMessage[] = Object.values(error.errors || {}).map(
    (el: any) => {
      return {
        path: el.path,
        message: el.message,
      };
    }
  );

  const code = 400;
  return {
    code,
    message: 'Validation Error',
    errorMessages,
    traceId,
  };
};

export default handleValidationError;
