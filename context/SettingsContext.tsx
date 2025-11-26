import { createContext, useContext } from 'react';
import { AspectRatio } from '../types';

interface SettingsContextType {
  aspectRatio: AspectRatio;
}

export const SettingsContext = createContext<SettingsContextType>({ aspectRatio: '16:9' });

export const useSettings = () => useContext(SettingsContext);