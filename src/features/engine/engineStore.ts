import { create } from 'zustand';

export interface ModelLoading {
  label: string;
  /** 0..1 */
  progress: number;
}

interface EngineState {
  loading: ModelLoading | null;
  /** Labels of models currently resident in memory. */
  resident: string[];
}

export const useEngineStore = create<EngineState>()(() => ({ loading: null, resident: [] }));

export const engineActions = {
  loading(label: string, progress: number) {
    useEngineStore.setState({ loading: { label, progress } });
  },
  loaded(resident: string[]) {
    useEngineStore.setState({ loading: null, resident });
  },
  failed() {
    useEngineStore.setState({ loading: null });
  },
};
