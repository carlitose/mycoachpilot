import { useDispatch } from 'react-redux';

import type { AppDispatch } from '@infrastructure/state';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
