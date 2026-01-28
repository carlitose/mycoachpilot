import { useSelector } from 'react-redux';

import type { RootState } from '@infrastructure/state';

export const useAppSelector = useSelector.withTypes<RootState>();
